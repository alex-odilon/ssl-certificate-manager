import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse as FastAPIFileResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import os
import json
import aiofiles

from app.database import get_db
from app.models import User, File, FileType
from app.schemas import CSRCreate, FileResponse
from app.routers.auth import get_current_user
from app.utils.crypto import generate_private_key, generate_csr
from app.utils.file_crypto import encrypt_file
from app.config import settings

router = APIRouter()
logger = logging.getLogger("ssl_manager.csr")


def _parse_tags(raw) -> list:
    if not raw:
        return []
    if isinstance(raw, list):
        return raw
    try:
        return json.loads(raw)
    except Exception:
        return []


@router.post("/generate", response_model=FileResponse)
async def generate_csr_endpoint(
    csr_data: CSRCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a new CSR and its corresponding private key."""
    try:
        private_key_pem = generate_private_key(key_type=csr_data.key_type, key_size=csr_data.key_size)
        csr_pem = generate_csr(private_key_pem, csr_data.model_dump())

        ts = int(datetime.utcnow().timestamp())
        tags_json = json.dumps(csr_data.tags) if csr_data.tags else "[]"

        key_filename = f"csr_private_key_{current_user.id}_{ts}.pem"
        key_path = os.path.join(settings.SSL_FILES_DIR, key_filename)

        async with aiofiles.open(key_path, 'wb') as f:
            await f.write(encrypt_file(private_key_pem, settings.ENCRYPTION_KEY))

        db_key = File(
            filename=key_filename,
            custom_name=f"{csr_data.custom_name}_private_key",
            description=f"Chave privada do CSR: {csr_data.custom_name}",
            file_type=FileType.PRIVATE_KEY,
            file_path=key_path,
            tags=tags_json,
            owner_id=current_user.id
        )
        db.add(db_key)

        csr_filename = f"csr_{current_user.id}_{ts}.csr"
        csr_path = os.path.join(settings.SSL_FILES_DIR, csr_filename)

        async with aiofiles.open(csr_path, 'wb') as f:
            await f.write(csr_pem)

        db_csr = File(
            filename=csr_filename,
            custom_name=csr_data.custom_name,
            description=csr_data.description,
            file_type=FileType.CSR,
            file_path=csr_path,
            tags=tags_json,
            owner_id=current_user.id
        )
        db.add(db_csr)
        db.commit()
        db.refresh(db_csr)
        db_csr.tags = _parse_tags(db_csr.tags)
        return db_csr

    except HTTPException:
        raise
    except Exception:
        db.rollback()
        logger.error("CSR generation failed", exc_info=True, extra={"user_id": current_user.id})
        raise HTTPException(status_code=500, detail="Erro ao gerar CSR. Contate o administrador.")


@router.get("/", response_model=List[FileResponse])
async def list_csrs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all CSRs for the current user."""
    csrs = db.query(File).filter(
        File.owner_id == current_user.id,
        File.file_type == FileType.CSR
    ).all()
    for csr in csrs:
        csr.tags = _parse_tags(csr.tags)
    return csrs


@router.get("/{csr_id}/download")
async def download_csr(
    csr_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a CSR file."""
    csr_file = db.query(File).filter(
        File.id == csr_id,
        File.owner_id == current_user.id,
        File.file_type == FileType.CSR
    ).first()

    if not csr_file:
        raise HTTPException(status_code=404, detail="CSR não encontrado.")

    if not os.path.exists(csr_file.file_path):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado no disco.")

    return FastAPIFileResponse(
        path=csr_file.file_path,
        filename=csr_file.custom_name + ".csr",
        media_type="application/x-pem-file"
    )
