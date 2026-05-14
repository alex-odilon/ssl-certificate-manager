import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile, Form
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import os
import json
import aiofiles

from app.database import get_db
from app.models import User, File, FileType
from app.schemas import KeyCreate, FileResponse
from app.routers.auth import get_current_user
from app.utils.crypto import generate_private_key, validate_private_key
from app.utils.file_crypto import encrypt_file, decrypt_file, is_valid_pem
from app.config import settings

router = APIRouter()
logger = logging.getLogger("ssl_manager.keys")


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
async def generate_key(
    file_data: KeyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a new private key (RSA 2048/3072/4096 or EC P-256/P-384)."""
    try:
        private_key_pem = generate_private_key(key_type=file_data.key_type, key_size=file_data.key_size)

        filename = f"private_key_{current_user.id}_{int(datetime.utcnow().timestamp())}.pem"
        file_path = os.path.join(settings.SSL_FILES_DIR, filename)

        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(encrypt_file(private_key_pem, settings.ENCRYPTION_KEY))

        db_file = File(
            filename=filename,
            custom_name=file_data.custom_name,
            description=file_data.description,
            file_type=FileType.PRIVATE_KEY,
            file_path=file_path,
            tags=json.dumps(file_data.tags) if file_data.tags else "[]",
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
        logger.error("Key generation failed", exc_info=True, extra={"user_id": current_user.id})
        raise HTTPException(status_code=500, detail="Erro ao gerar chave privada. Contate o administrador.")


@router.post("/upload", response_model=FileResponse)
async def upload_key(
    file: UploadFile = FastAPIFile(...),
    custom_name: str = Form(...),
    description: str = Form(None),
    tags: str = Form("[]"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a private key file."""
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

        validation = validate_private_key(content)
        if not validation['valid']:
            raise HTTPException(status_code=400, detail=f"Chave privada inválida: {validation.get('error', 'Erro desconhecido')}")

        os.makedirs(settings.SSL_FILES_DIR, exist_ok=True)
        filename = f"uploaded_key_{current_user.id}_{int(datetime.utcnow().timestamp())}.pem"
        file_path = os.path.join(settings.SSL_FILES_DIR, filename)

        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(encrypt_file(content, settings.ENCRYPTION_KEY))

        tags_list = _parse_tags(tags)
        db_file = File(
            filename=filename,
            custom_name=custom_name,
            description=description,
            file_type=FileType.PRIVATE_KEY,
            file_path=file_path,
            tags=json.dumps(tags_list),
            owner_id=current_user.id
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        db_file.tags = tags_list
        return db_file

    except HTTPException:
        raise
    except Exception:
        logger.error("Key upload failed", exc_info=True, extra={"user_id": current_user.id})
        raise HTTPException(status_code=500, detail="Erro ao importar chave privada. Contate o administrador.")


@router.get("/", response_model=List[FileResponse])
async def list_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all private keys for the current user."""
    keys = db.query(File).filter(
        File.owner_id == current_user.id,
        File.file_type == FileType.PRIVATE_KEY
    ).all()
    for key in keys:
        key.tags = _parse_tags(key.tags)
    return keys


@router.get("/{key_id}/download")
async def download_key(
    key_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a private key file."""
    key_file = db.query(File).filter(
        File.id == key_id,
        File.owner_id == current_user.id,
        File.file_type == FileType.PRIVATE_KEY
    ).first()

    if not key_file:
        raise HTTPException(status_code=404, detail="Chave privada não encontrada.")

    if not os.path.exists(key_file.file_path):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado no disco.")

    async with aiofiles.open(key_file.file_path, 'rb') as f:
        raw = await f.read()

    pem = decrypt_file(raw, settings.ENCRYPTION_KEY)

    return Response(
        content=pem,
        media_type="application/x-pem-file",
        headers={"Content-Disposition": f'attachment; filename="{key_file.custom_name}.pem"'},
    )
