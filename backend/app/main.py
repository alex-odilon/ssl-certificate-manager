import logging
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from sqlalchemy import text
from sqlalchemy.orm import Session
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.database import engine, Base, SessionLocal, get_db
from app.routers import auth, certificates, keys, csr, pfx, files, validation, ssh, admin, app_certs, shares
from app.config import settings
from app.logging_config import configure_logging
from app.rate_limit import limiter

configure_logging()
logger = logging.getLogger("ssl_manager")

_INSECURE_KEYS = {"your-secret-key-here-change-in-production", "changeme", "secret"}


def _validate_config() -> None:
    if settings.SECRET_KEY in _INSECURE_KEYS:
        raise RuntimeError(
            "FATAL: SECRET_KEY não foi configurado. "
            "Gere um com 'openssl rand -hex 32' e configure no .env."
        )
    if not settings.ENCRYPTION_KEY:
        logger.warning("ENCRYPTION_KEY não configurada — chaves privadas não estão criptografadas em disco.")
    if settings.ADMIN_PASSWORD in {"admin123", "sslmanager123", "changeme"}:
        logger.warning(
            "ADMIN_PASSWORD usa um valor padrão inseguro. "
            "Troque a senha do admin imediatamente após o primeiro login."
        )


def _run_migrations(db) -> None:
    migrations = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS login_locked BOOLEAN DEFAULT FALSE",
        # Ensure the filetype ENUM type exists (idempotent)
        """
        DO $$ BEGIN
            CREATE TYPE filetype AS ENUM ('private_key', 'certificate', 'csr', 'pfx', 'ca_bundle');
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
        """,
        # AuditLog table
        """CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            action VARCHAR NOT NULL,
            resource_type VARCHAR,
            resource_id INTEGER,
            details TEXT,
            ip_address VARCHAR,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )""",
    ]
    for stmt in migrations:
        try:
            db.execute(text(stmt))
        except Exception as exc:
            logger.warning("Migration skipped", extra={"stmt": stmt[:80], "reason": str(exc)})
    db.commit()
    logger.info("Database migrations applied")


def _ensure_admin(db) -> None:
    from app.models import User
    from app.routers.auth import get_password_hash

    if db.query(User).filter(User.role == "admin").first():
        return

    admin_user = User(
        email=settings.ADMIN_EMAIL,
        username=settings.ADMIN_USERNAME,
        hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
        role="admin",
        is_active=True,
        force_password_change=True,
    )
    db.add(admin_user)
    db.commit()
    logger.info("Default admin user created", extra={"username": settings.ADMIN_USERNAME})
    logger.warning("Change the admin password on first login!")


@asynccontextmanager
async def lifespan(app: FastAPI):
    _validate_config()
    Base.metadata.create_all(bind=engine)

    import os
    os.makedirs(settings.SSL_FILES_DIR, exist_ok=True)

    db = SessionLocal()
    try:
        _run_migrations(db)
        _ensure_admin(db)
    finally:
        db.close()

    logger.info("SSL Certificate Manager started", extra={"version": "2.0.0", "docs_enabled": settings.ENABLE_DOCS})
    yield
    logger.info("SSL Certificate Manager shutting down")


app = FastAPI(
    title="SSL Certificate Manager",
    description="Gerenciador corporativo de certificados SSL/TLS e chaves SSH",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENABLE_DOCS else None,
    redoc_url="/redoc" if settings.ENABLE_DOCS else None,
    openapi_url="/openapi.json" if settings.ENABLE_DOCS else None,
)

# ── Rate limiter ─────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ─────────────────────────────────────────────────────────────────────
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


# ── CSRF protection ───────────────────────────────────────────────────────────
@app.middleware("http")
async def csrf_protection(request: Request, call_next):
    if request.method in ("POST", "PUT", "DELETE", "PATCH"):
        origin = request.headers.get("Origin", "")
        if origin and origin not in origins:
            return JSONResponse(
                status_code=403,
                content={"detail": "CSRF protection triggered."}
            )
    return await call_next(request)


# ── Global exception handlers ─────────────────────────────────────────────────
@app.exception_handler(404)
async def not_found_handler(_request: Request, _exc):
    return JSONResponse(status_code=404, content={"detail": "Recurso não encontrado."})


@app.exception_handler(500)
async def server_error_handler(_request: Request, exc):
    logger.error("Unhandled server error", exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Erro interno do servidor. Contate o administrador."})


# ── Routers ───────────────────────────────────────────────────────────────────
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
async def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "ok"}
    except Exception:
        logger.error("Health check failed — database unreachable")
        return JSONResponse(status_code=503, content={"status": "unhealthy", "database": "unreachable"})
