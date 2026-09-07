from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.core.limiter import limiter
from app.routers import auth, targets, scans, vulnerabilities, ai, reports, dashboard
from app.models.user import User
from app.core.security import get_password_hash
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("cyvera")

# Create Database tables automatically on startup
Base.metadata.create_all(bind=engine)

def seed_demo_user():
    """Seeds a demo developer account if none exists for quick evaluation."""
    db = SessionLocal()
    try:
        demo = db.query(User).filter(User.username == "secops_demo").first()
        if not demo:
            user = User(
                email="demo@cyvera.io",
                username="secops_demo",
                hashed_password=get_password_hash("CyveraSecurity2025!"),
                is_active=True,
                is_verified=True
            )
            db.add(user)
            db.commit()
            logger.info("Demo user 'secops_demo' (password: CyveraSecurity2025!) created.")
    except Exception as e:
        logger.warning(f"Seed demo user notice: {e}")
    finally:
        db.close()

seed_demo_user()

app = FastAPI(
    title="Cyvera — AI-Powered Web Security Scanner API",
    description="Enterprise-grade automated vulnerability scanning, OWASP classification, and Gemini AI remediation engine.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# SlowAPI Rate Limiter
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
def rate_limit_custom_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Rate limit exceeded. Please slow down."}
    )

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers with both /api/v1 and /v1 prefixes for Vercel routing compatibility
for prefix in ["/api/v1", "/v1"]:
    app.include_router(auth.router, prefix=prefix)
    app.include_router(targets.router, prefix=prefix)
    app.include_router(scans.router, prefix=prefix)
    app.include_router(vulnerabilities.router, prefix=prefix)
    app.include_router(ai.router, prefix=prefix)
    app.include_router(reports.router, prefix=prefix)
    app.include_router(dashboard.router, prefix=prefix)

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Cyvera Security Scanner",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
