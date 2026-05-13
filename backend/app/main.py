from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text
import os

from app.database import engine, Base, SessionLocal
from app.routers import auth, certificates, keys, csr, pfx, files, validation, ssh, admin, app_certs, shares
from app.config import settings


def _run_migrations(db):
    """Add new columns / tables that may not exist in older databases."""
    migrations = [
        # User table — new columns for role-based access and security
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR",
        # SSH key pairs table (handled by create_all if not exists)
    ]
    for stmt in migrations:
        try:
            db.execute(text(stmt))
        except Exception as exc:
            # Non-fatal — column may already exist or DB may not support IF NOT EXISTS
            print(f"Migration note: {exc}")
    db.commit()


def _ensure_admin(db):
    """Create the default admin user if no admin exists yet."""
    from app.models import User
    from app.routers.auth import get_password_hash

    admin_exists = db.query(User).filter(User.role == "admin").first()
    if admin_exists:
        return

    admin_user = User(
        email=settings.ADMIN_EMAIL,
        username=settings.ADMIN_USERNAME,
        hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
        role="admin",
        is_active=True,
        force_password_change=True,   # Force password change on first login
    )
    db.add(admin_user)
    db.commit()
    print(f"[startup] Default admin user created: {settings.ADMIN_USERNAME!r}")
    print("[startup] IMPORTANT: Change the admin password on first login!")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ────────────────────────────────────────────────────────────────
    Base.metadata.create_all(bind=engine)
    os.makedirs(settings.SSL_FILES_DIR, exist_ok=True)

    db = SessionLocal()
    try:
        _run_migrations(db)
        _ensure_admin(db)
    finally:
        db.close()

    yield
    # ── Shutdown ───────────────────────────────────────────────────────────────


app = FastAPI(
    title="SSL Certificate Manager",
    description="Gerenciador corporativo de certificados SSL/TLS e chaves SSH",
    version="2.0.0",
    lifespan=lifespan,
    # Hide docs in production by setting docs_url=None in the config
)

# ── CORS ────────────────────────────────────────────────────────────────────────
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── Routers ─────────────────────────────────────────────────────────────────────
app.include_router(auth.router,         prefix="/api/auth",         tags=["Authentication"])
app.include_router(admin.router,        prefix="/api/admin",        tags=["Admin"])
app.include_router(certificates.router, prefix="/api/certificates", tags=["Certificates"])
app.include_router(keys.router,         prefix="/api/keys",         tags=["Private Keys"])
app.include_router(csr.router,          prefix="/api/csr",          tags=["CSR"])
app.include_router(pfx.router,          prefix="/api/pfx",          tags=["PFX"])
app.include_router(files.router,        prefix="/api/files",        tags=["Files"])
app.include_router(validation.router,   prefix="/api/validation",   tags=["Validation"])
app.include_router(ssh.router,          prefix="/api/ssh",          tags=["SSH Keys"])
app.include_router(app_certs.router,    prefix="/api/app-certs",    tags=["App Certificates"])
app.include_router(shares.router,       prefix="/api/shares",       tags=["Shares"])


@app.get("/")
async def root():
    return {"message": "SSL Certificate Manager API", "version": "2.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
