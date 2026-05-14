import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile, Form
from fastapi.responses import FileResponse as FastAPIFileResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import os
import aiofiles
import json

from app.database import get_db
from app.models import User, File, FileType, PfxPassword
from app.schemas import FileResponse
from app.routers.auth import get_current_user
from app.utils.crypto import validate_certificate, validate_pfx
from app.utils.file_crypto import is_valid_pem
from app.config import settings

router = APIRouter()
logger = logging.getLogger("ssl_manager.certificates")


def _parse_tags(raw) -> list:
    if not raw:
        return []
    if isinstance(raw, list):
        return raw
    try:
        return json.loads(raw)
    except Exception:
        return []


def _get_pfx_password(db, pfx_file: File) -> str | None:
    """Decrypt PFX password using the same fallback logic as pfx.py."""
    record = db.query(PfxPassword).filter(PfxPassword.file_id == pfx_file.id).first()
    if not record:
        return None
    from app.routers.pfx import _decrypt_pfx_password
    try:
        return _decrypt_pfx_password(record.encrypted_password)
    except Exception:
        return None


@router.post("/upload", response_model=FileResponse)
async def upload_certificate(
    file: UploadFile = FastAPIFile(...),
    custom_name: str = Form(...),
    description: str = Form(None),
    tags: str = Form("[]"),
    file_type: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a certificate or CA bundle file."""
    if file_type not in ('certificate', 'ca_bundle'):
        raise HTTPException(status_code=400, detail="Tipo de arquivo inválido.")

    MAX_SIZE = 1 * 1024 * 1024
    content = b""
    try:
        while True:
            chunk = await file.read(64 * 1024)
            if not chunk:
                break
            content += chunk
            if len(content) > MAX_SIZE:
                raise HTTPException(status_code=413, detail="Arquivo muito grande (máximo 1 MB).")

        if not is_valid_pem(content):
            raise HTTPException(status_code=400, detail="O arquivo não parece ser um PEM válido.")

        validation = validate_certificate(content)
        if not validation['valid']:
            raise HTTPException(status_code=400, detail=f"Certificado inválido: {validation.get('error', 'Erro desconhecido')}")

        db_file_type = FileType.CERTIFICATE if file_type == 'certificate' else FileType.CA_BUNDLE

        filename = f"{file_type}_{current_user.id}_{int(datetime.utcnow().timestamp())}.pem"
        file_path = os.path.join(settings.SSL_FILES_DIR, filename)

        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)

        db_file = File(
            filename=filename,
            custom_name=custom_name,
            description=description,
            file_type=db_file_type,
            file_path=file_path,
            tags=json.dumps(_parse_tags(tags)),
            owner_id=current_user.id
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        db_file.tags = _parse_tags(db_file.tags)
        return db_file

    except HTTPException:
        raise
    except Exception:
        logger.error("Certificate upload failed", exc_info=True, extra={"user_id": current_user.id})
        raise HTTPException(status_code=500, detail="Erro ao importar certificado. Contate o administrador.")


@router.get("/", response_model=List[FileResponse])
async def list_certificates(
    file_type: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List certificates and/or CA bundles for the current user."""
    query = db.query(File).filter(File.owner_id == current_user.id)

    if file_type == 'certificate':
        query = query.filter(File.file_type == FileType.CERTIFICATE)
    elif file_type == 'ca_bundle':
        query = query.filter(File.file_type == FileType.CA_BUNDLE)
    else:
        query = query.filter(File.file_type.in_([FileType.CERTIFICATE, FileType.CA_BUNDLE]))

    certificates = query.all()
    for cert in certificates:
        cert.tags = _parse_tags(cert.tags)
    return certificates


@router.get("/expiring", response_model=List[dict])
async def get_expiring_certificates(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return CERTIFICATE, CA_BUNDLE and PFX files expiring within `days` days."""
    cert_files = db.query(File).filter(
        File.owner_id == current_user.id,
        File.file_type.in_([FileType.CERTIFICATE, FileType.CA_BUNDLE, FileType.PFX]),
    ).all()

    expiring = []

    for cert in cert_files:
        try:
            if not os.path.exists(cert.file_path):
                continue

            async with aiofiles.open(cert.file_path, "rb") as f:
                content = await f.read()

            if cert.file_type == FileType.PFX:
                password = _get_pfx_password(db, cert)
                if not password:
                    continue
                info = validate_pfx(content, password)
            else:
                info = validate_certificate(content)

            if not info.get("valid"):
                continue

            days_left = info.get("days_until_expiry")
            if days_left is None or days_left > days:
                continue

            expiring.append({
                "id": cert.id,
                "custom_name": cert.custom_name,
                "file_type": cert.file_type.value,
                "days_until_expiry": days_left,
                "expiry_date": info.get("not_after", ""),
                "common_name": info.get("common_name", ""),
                "is_expired": info.get("is_expired", False),
            })
        except Exception as exc:
            logger.warning("Could not check expiry for cert", extra={"cert_id": cert.id, "error": str(exc)})
            continue

    expiring.sort(key=lambda x: x["days_until_expiry"])
    return expiring


@router.get("/{cert_id}/download")
async def download_certificate(
    cert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a certificate or CA bundle file."""
    cert_file = db.query(File).filter(
        File.id == cert_id,
        File.owner_id == current_user.id,
        File.file_type.in_([FileType.CERTIFICATE, FileType.CA_BUNDLE])
    ).first()

    if not cert_file:
        raise HTTPException(status_code=404, detail="Certificado não encontrado.")

    if not os.path.exists(cert_file.file_path):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado no disco.")

    extension = ".crt" if cert_file.file_type == FileType.CERTIFICATE else ".pem"

    return FastAPIFileResponse(
        path=cert_file.file_path,
        filename=cert_file.custom_name + extension,
        media_type="application/x-pem-file"
    )
