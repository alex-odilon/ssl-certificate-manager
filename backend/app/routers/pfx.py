import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse as FastAPIFileResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import os
import json
import hashlib
import base64
import aiofiles
from cryptography.fernet import Fernet, InvalidToken
from fastapi.concurrency import run_in_threadpool

from app.database import get_db
from app.models import User, File, FileType, PfxPassword
from app.schemas import PFXCreate, PFXResponse
from app.routers.auth import get_current_user
from app.utils.crypto import create_pfx, generate_password
from app.utils.file_crypto import decrypt_file
from app.config import settings

router = APIRouter()
logger = logging.getLogger("ssl_manager.pfx")


def _make_fernet(key_material: str) -> Fernet:
    """Derive a stable Fernet key from key material."""
    digest = hashlib.sha256(key_material.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def _encrypt_pfx_password(password: str) -> str:
    """Encrypt PFX password using ENCRYPTION_KEY (preferred) or SECRET_KEY."""
    key = settings.ENCRYPTION_KEY if settings.ENCRYPTION_KEY else settings.SECRET_KEY
    return _make_fernet(key).encrypt(password.encode()).decode()


def _decrypt_pfx_password(encrypted: str) -> str:
    """Decrypt PFX password, trying ENCRYPTION_KEY first then SECRET_KEY as fallback."""
    if settings.ENCRYPTION_KEY:
        try:
            return _make_fernet(settings.ENCRYPTION_KEY).decrypt(encrypted.encode()).decode()
        except (InvalidToken, Exception):
            pass
    return _make_fernet(settings.SECRET_KEY).decrypt(encrypted.encode()).decode()


@router.post("/generate", response_model=PFXResponse)
async def generate_pfx_endpoint(
    pfx_data: PFXCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a PFX file from certificate, CA bundle, and private key."""
    certificate = db.query(File).filter(
        File.id == pfx_data.certificate_id,
        File.owner_id == current_user.id,
        File.file_type == FileType.CERTIFICATE
    ).first()

    ca_bundle = None
    if pfx_data.ca_bundle_id:
        ca_bundle = db.query(File).filter(
            File.id == pfx_data.ca_bundle_id,
            File.owner_id == current_user.id,
            File.file_type == FileType.CA_BUNDLE,
        ).first()

    private_key = db.query(File).filter(
        File.id == pfx_data.private_key_id,
        File.owner_id == current_user.id,
        File.file_type == FileType.PRIVATE_KEY
    ).first()

    if not certificate or not private_key:
        raise HTTPException(status_code=404, detail="Certificado ou chave privada não encontrados.")

    try:
        async with aiofiles.open(certificate.file_path, 'rb') as f:
            cert_pem = await f.read()

        ca_pem: bytes | None = None
        if ca_bundle:
            async with aiofiles.open(ca_bundle.file_path, 'rb') as f:
                ca_pem = await f.read()

        async with aiofiles.open(private_key.file_path, 'rb') as f:
            raw_key = await f.read()
        key_pem = decrypt_file(raw_key, settings.ENCRYPTION_KEY)

        password = generate_password()
        pfx_data_bytes = await run_in_threadpool(
            create_pfx, cert_pem, key_pem, password, ca_bundle_pem=ca_pem
        )

        pfx_filename = f"pfx_{current_user.id}_{int(datetime.utcnow().timestamp())}.pfx"
        pfx_path = os.path.join(settings.SSL_FILES_DIR, pfx_filename)

        async with aiofiles.open(pfx_path, 'wb') as f:
            await f.write(pfx_data_bytes)

        db_pfx = File(
            filename=pfx_filename,
            custom_name=pfx_data.custom_name,
            description=pfx_data.description,
            file_type=FileType.PFX,
            file_path=pfx_path,
            tags=json.dumps(pfx_data.tags) if pfx_data.tags else "[]",
            owner_id=current_user.id
        )
        db.add(db_pfx)
        db.flush()

        encrypted_password = _encrypt_pfx_password(password)
        db.add(PfxPassword(file_id=db_pfx.id, encrypted_password=encrypted_password))

        db.commit()
        db.refresh(db_pfx)

        if db_pfx.tags:
            try:
                db_pfx.tags = json.loads(db_pfx.tags)
            except Exception:
                db_pfx.tags = []
        else:
            db_pfx.tags = []

        response = PFXResponse.model_validate(db_pfx)
        response.password_masked = password
        return response

    except HTTPException:
        raise
    except Exception:
        db.rollback()
        logger.error("PFX generation failed", exc_info=True, extra={"user_id": current_user.id})
        raise HTTPException(status_code=500, detail="Erro ao gerar o arquivo PFX. Contate o administrador.")


@router.get("/", response_model=List[PFXResponse])
async def list_pfx_files(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all PFX files for the current user."""
    pfx_files = db.query(File).filter(
        File.owner_id == current_user.id,
        File.file_type == FileType.PFX
    ).all()

    responses = []
    for pfx in pfx_files:
        if pfx.tags:
            try:
                pfx.tags = json.loads(pfx.tags)
            except Exception:
                pfx.tags = []
        else:
            pfx.tags = []
        responses.append(PFXResponse.model_validate(pfx))

    return responses


@router.get("/{pfx_id}/password")
async def get_pfx_password(
    pfx_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the decrypted password for a PFX file."""
    pfx_file = db.query(File).filter(
        File.id == pfx_id,
        File.owner_id == current_user.id,
        File.file_type == FileType.PFX
    ).first()

    if not pfx_file:
        raise HTTPException(status_code=404, detail="PFX file not found")

    password_record = db.query(PfxPassword).filter(PfxPassword.file_id == pfx_id).first()
    if not password_record:
        raise HTTPException(status_code=404, detail="Password not found")

    try:
        decrypted_password = _decrypt_pfx_password(password_record.encrypted_password)
    except Exception:
        logger.error("PFX password decryption failed", extra={"pfx_id": pfx_id})
        raise HTTPException(
            status_code=500,
            detail="Não foi possível descriptografar a senha. Contate o administrador."
        )

    return {"password": decrypted_password, "masked": "*" * 25}


@router.get("/{pfx_id}/download")
async def download_pfx(
    pfx_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a PFX file."""
    pfx_file = db.query(File).filter(
        File.id == pfx_id,
        File.owner_id == current_user.id,
        File.file_type == FileType.PFX
    ).first()

    if not pfx_file:
        raise HTTPException(status_code=404, detail="PFX file not found")

    if not os.path.exists(pfx_file.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FastAPIFileResponse(
        path=pfx_file.file_path,
        filename=pfx_file.custom_name + ".pfx",
        media_type="application/x-pkcs12"
    )
