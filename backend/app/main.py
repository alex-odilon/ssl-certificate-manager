from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.database import engine, Base
from app.routers import auth, certificates, keys, csr, pfx, files, validation
from app.config import settings

# Create tables on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    # Create SSL files directory if not exists
    os.makedirs(settings.SSL_FILES_DIR, exist_ok=True)
    yield
    # Shutdown

app = FastAPI(
    title="SSL Certificate Manager",
    description="Aplicação para gerenciamento de certificados SSL/TLS",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(certificates.router, prefix="/api/certificates", tags=["Certificates"])
app.include_router(keys.router, prefix="/api/keys", tags=["Private Keys"])
app.include_router(csr.router, prefix="/api/csr", tags=["CSR"])
app.include_router(pfx.router, prefix="/api/pfx", tags=["PFX"])
app.include_router(files.router, prefix="/api/files", tags=["Files"])
app.include_router(validation.router, prefix="/api/validation", tags=["Validation"])

@app.get("/")
async def root():
    return {"message": "SSL Certificate Manager API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}