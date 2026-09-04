from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.exceptions import BadRequestException, UnauthorizedException
from app.core.limiter import limiter
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, TokenResponse, TokenRefreshRequest, UserResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def register(request: Request, body: UserRegisterRequest, db: Session = Depends(get_db)):
    # Check if username or email exists
    existing = db.query(User).filter((User.email == body.email.lower()) | (User.username == body.username)).first()
    if existing:
        raise BadRequestException("A user with that email or username already exists")

    hashed_pw = get_password_hash(body.password)
    user = User(
        email=body.email.lower(),
        username=body.username,
        hashed_password=hashed_pw
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Audit log
    audit = AuditLog(
        user_id=user.id,
        action="auth.register",
        resource="user",
        resource_id=user.id,
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()

    return user

@router.post("/login", response_model=TokenResponse)
@limiter.limit("20/minute")
def login(request: Request, body: UserLoginRequest, db: Session = Depends(get_db)):
    identifier = body.username_or_email.strip().lower()
    user = db.query(User).filter(
        (User.email == identifier) | (User.username.ilike(body.username_or_email.strip()))
    ).first()

    if not user or not verify_password(body.password, user.hashed_password):
        raise UnauthorizedException("Invalid username/email or password")

    if not user.is_active:
        raise UnauthorizedException("User account is inactive")

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)

    # Audit log
    audit = AuditLog(
        user_id=user.id,
        action="auth.login",
        resource="user",
        resource_id=user.id,
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(body: TokenRefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise UnauthorizedException("Invalid or expired refresh token")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise UnauthorizedException("User account does not exist or is disabled")

    access_token = create_access_token(subject=user.id)
    new_refresh = create_refresh_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
