from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import json
import os
import aiofiles

from app.database import get_db
from app.models import User, SshKeyPair
from app.schemas import SSHKeyCreate, SSHKeyResponse
from app.routers.auth import get_current_user
from app.utils.crypto import generate_ssh_keypair
from app.config import settings

router = APIRouter()


def _parse_tags(raw: str | None) -> list:
    if not raw:
        return []
    try:
        return json.loads(raw)
    except Exception:
        return []


def _to_response(pair: SshKeyPair) -> SSHKeyResponse:
    return SSHKeyResponse(
        id=pair.id,
        custom_name=pair.custom_name,
        description=pair.description,
        tags=_parse_tags(pair.tags),
        key_type=pair.key_type,
        key_size=pair.key_size,
        comment=pair.comment or "",
        has_passphrase=pair.has_passphrase,
        public_key_content=pair.public_key_content,
        private_key_filename=pair.private_key_filename,
        created_at=pair.created_at,
    )


@router.post("/generate", response_model=SSHKeyResponse, status_code=201)
async def generate_ssh_key(
    data: SSHKeyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate an SSH key pair.

    The private key is saved to disk (optionally encrypted with the supplied
    passphrase using OpenSSH bcrypt-KDF).  The passphrase itself is **never**
    persisted — only the flag `has_passphrase` is stored so the user knows
    whether their key is protected.

    The public key (authorized_keys format) is safe to store in the database
    and is returned in every response for easy copying.
    """
    try:
        private_key_bytes, public_key_line = generate_ssh_keypair(
            key_type=data.key_type,
            key_size=data.key_size,
            passphrase=data.passphrase if data.passphrase else None,
            comment=data.comment,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Erro ao gerar chave SSH: {exc}")

    # Persist the private key to disk
    os.makedirs(settings.SSL_FILES_DIR, exist_ok=True)
    timestamp = int(datetime.utcnow().timestamp())
    filename = f"ssh_{current_user.id}_{timestamp}.pem"
    file_path = os.path.join(settings.SSL_FILES_DIR, filename)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(private_key_bytes)

    # Determine effective key_size (Ed25519 has no configurable size)
    effective_size: int | None = None
    if data.key_type.upper() != "ED25519":
        effective_size = data.key_size

    db_pair = SshKeyPair(
        custom_name=data.custom_name,
        description=data.description,
        tags=json.dumps(data.tags) if data.tags else "[]",
        key_type=data.key_type.upper(),
        key_size=effective_size,
        comment=data.comment,
        has_passphrase=bool(data.passphrase),
        private_key_filename=filename,
        private_key_path=file_path,
        public_key_content=public_key_line,
        owner_id=current_user.id,
    )
    db.add(db_pair)
    db.commit()
    db.refresh(db_pair)

    return _to_response(db_pair)


@router.get("/", response_model=List[SSHKeyResponse])
async def list_ssh_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all SSH key pairs belonging to the current user."""
    pairs = (
        db.query(SshKeyPair)
        .filter(SshKeyPair.owner_id == current_user.id)
        .order_by(SshKeyPair.created_at.desc())
        .all()
    )
    return [_to_response(p) for p in pairs]


@router.get("/{pair_id}", response_model=SSHKeyResponse)
async def get_ssh_key(
    pair_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single SSH key pair."""
    pair = db.query(SshKeyPair).filter(
        SshKeyPair.id == pair_id,
        SshKeyPair.owner_id == current_user.id,
    ).first()
    if not pair:
        raise HTTPException(status_code=404, detail="SSH key pair not found")
    return _to_response(pair)


@router.get("/{pair_id}/download/private")
async def download_private_key(
    pair_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download the private key file."""
    pair = db.query(SshKeyPair).filter(
        SshKeyPair.id == pair_id,
        SshKeyPair.owner_id == current_user.id,
    ).first()
    if not pair:
        raise HTTPException(status_code=404, detail="SSH key pair not found")
    if not os.path.exists(pair.private_key_path):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado no disco")

    async with aiofiles.open(pair.private_key_path, "rb") as f:
        content = await f.read()

    safe_name = pair.custom_name.replace(" ", "_")
    return Response(
        content=content,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}"'},
    )


@router.get("/{pair_id}/download/public")
async def download_public_key(
    pair_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download the public key in authorized_keys format."""
    pair = db.query(SshKeyPair).filter(
        SshKeyPair.id == pair_id,
        SshKeyPair.owner_id == current_user.id,
    ).first()
    if not pair:
        raise HTTPException(status_code=404, detail="SSH key pair not found")

    safe_name = pair.custom_name.replace(" ", "_") + ".pub"
    return Response(
        content=pair.public_key_content.encode("utf-8"),
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}"'},
    )


@router.delete("/{pair_id}")
async def delete_ssh_key(
    pair_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an SSH key pair (DB record + private key file on disk)."""
    pair = db.query(SshKeyPair).filter(
        SshKeyPair.id == pair_id,
        SshKeyPair.owner_id == current_user.id,
    ).first()
    if not pair:
        raise HTTPException(status_code=404, detail="SSH key pair not found")

    file_path = pair.private_key_path
    db.delete(pair)
    db.commit()

    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as exc:
        # Log but don't fail — DB record already removed
        print(f"Warning: could not delete SSH private key from disk: {exc}")

    return {"message": "SSH key pair deleted", "id": pair_id}
