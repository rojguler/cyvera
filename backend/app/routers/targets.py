from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.target import Target
from app.models.scan import Scan
from app.models.audit_log import AuditLog
from app.schemas.target import TargetCreateRequest, TargetUpdateRequest, TargetResponse
from app.services.ssrf_guard import validate_scan_target_url
from app.core.exceptions import NotFoundException, BadRequestException

router = APIRouter(prefix="/targets", tags=["Target Management"])

@router.get("", response_model=List[TargetResponse])
def list_targets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    targets = db.query(Target).filter(Target.user_id == current_user.id).order_by(Target.created_at.desc()).all()
    results = []
    for t in targets:
        # Fetch latest completed scan
        latest_scan = db.query(Scan).filter(
            Scan.target_id == t.id,
            Scan.status == "completed"
        ).order_by(Scan.completed_at.desc()).first()

        total_scans = db.query(Scan).filter(Scan.target_id == t.id).count()

        results.append(TargetResponse(
            id=t.id,
            user_id=t.user_id,
            name=t.name,
            url=t.url,
            description=t.description,
            is_active=t.is_active,
            created_at=t.created_at,
            updated_at=t.updated_at,
            total_scans=total_scans,
            latest_score=latest_scan.security_score if latest_scan else None
        ))
    return results

@router.post("", response_model=TargetResponse, status_code=status.HTTP_201_CREATED)
def create_target(request: Request, body: TargetCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Validate URL against SSRF policy
    clean_url = validate_scan_target_url(body.url)

    # Check duplicate target for this user
    existing = db.query(Target).filter(Target.user_id == current_user.id, Target.url == clean_url).first()
    if existing:
        raise BadRequestException("You have already added this target URL to your workspace")

    target = Target(
        user_id=current_user.id,
        name=body.name,
        url=clean_url,
        description=body.description
    )
    db.add(target)
    db.commit()
    db.refresh(target)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="target.created",
        resource="target",
        resource_id=target.id,
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()

    return TargetResponse(
        id=target.id,
        user_id=target.user_id,
        name=target.name,
        url=target.url,
        description=target.description,
        is_active=target.is_active,
        created_at=target.created_at,
        updated_at=target.updated_at,
        total_scans=0,
        latest_score=None
    )

@router.get("/{target_id}", response_model=TargetResponse)
def get_target(target_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target = db.query(Target).filter(Target.id == target_id, Target.user_id == current_user.id).first()
    if not target:
        raise NotFoundException("Target not found")

    latest_scan = db.query(Scan).filter(Scan.target_id == target.id, Scan.status == "completed").order_by(Scan.completed_at.desc()).first()
    total_scans = db.query(Scan).filter(Scan.target_id == target.id).count()

    return TargetResponse(
        id=target.id,
        user_id=target.user_id,
        name=target.name,
        url=target.url,
        description=target.description,
        is_active=target.is_active,
        created_at=target.created_at,
        updated_at=target.updated_at,
        total_scans=total_scans,
        latest_score=latest_scan.security_score if latest_scan else None
    )

@router.put("/{target_id}", response_model=TargetResponse)
def update_target(target_id: str, body: TargetUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target = db.query(Target).filter(Target.id == target_id, Target.user_id == current_user.id).first()
    if not target:
        raise NotFoundException("Target not found")

    if body.name is not None:
        target.name = body.name
    if body.description is not None:
        target.description = body.description
    if body.is_active is not None:
        target.is_active = body.is_active

    db.commit()
    db.refresh(target)

    latest_scan = db.query(Scan).filter(Scan.target_id == target.id, Scan.status == "completed").order_by(Scan.completed_at.desc()).first()
    total_scans = db.query(Scan).filter(Scan.target_id == target.id).count()

    return TargetResponse(
        id=target.id,
        user_id=target.user_id,
        name=target.name,
        url=target.url,
        description=target.description,
        is_active=target.is_active,
        created_at=target.created_at,
        updated_at=target.updated_at,
        total_scans=total_scans,
        latest_score=latest_scan.security_score if latest_scan else None
    )

@router.delete("/{target_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_target(target_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target = db.query(Target).filter(Target.id == target_id, Target.user_id == current_user.id).first()
    if not target:
        raise NotFoundException("Target not found")

    db.delete(target)
    db.commit()
    return None
