"""Router for application-to-application certificate management.

Covers:
  - Generating self-signed certificates (with private key) for mTLS/server-to-server auth.
  - Generating PFX bundles from a certificate + private key (no CA bundle required).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import json
import os
import aiofiles

from app.database import get_db
from app.models import User, File, FileType, PfxPassword
from app.schemas import SelfSignedCertCreate, SelfSignedCertResponse, FileResponse
from app.routers.auth import get_current_user
from app.utils.crypto import generate_self_signed_certificate
from app.config import settings

router = APIRouter()


def _parse_tags(raw: str | None) -> list:
    if not raw:
        return []
    try:
        return json.loads(raw)
    except Exception:
        return []


@router.post("/generate-self-signed", response_model=SelfSignedCertResponse, status_code=201)
async def generate_self_signed(
    data: SelfSignedCertCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a self-signed certificate + private key pair.

    Both files are saved to the database as regular SSL files so they can
    be used in PFX generation, validation, and download — just like any
    imported certificate.

    The certificate includes:
    - Extended Key Usage: Server Auth + Client Auth (mTLS ready)
    - Key Usage: Digital Signature + Key Encipherment
    - SAN: common_name + any extra san_domains
    - Configurable validity period (1 day – 10 years)
    """
    if not (1 <= data.validity_days <= 3650):
        raise HTTPException(
            status_code=400,
            detail="Validade deve estar entre 1 e 3650 dias (10 anos).",
        )

    try:
        cert_pem, key_pem = generate_self_signed_certificate(
            common_name=data.common_name,
            validity_days=data.validity_days,
            key_type=data.key_type,
            key_size=data.key_size,
            organization=data.organization,
            organizational_unit=data.organizational_unit,
            country=data.country,
            state=data.state,
            locality=data.locality,
            email=str(data.email) if data.email else None,
            san_domains=data.san_domains or [],
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Erro ao gerar certificado: {exc}")

    os.makedirs(settings.SSL_FILES_DIR, exist_ok=True)
    ts = int(datetime.utcnow().timestamp())
    tags_json = json.dumps(data.tags) if data.tags else "[]"

    # ── Save certificate ───────────────────────────────────────────────────────
    cert_filename = f"selfsigned_cert_{current_user.id}_{ts}.pem"
    cert_path = os.path.join(settings.SSL_FILES_DIR, cert_filename)
    async with aiofiles.open(cert_path, "wb") as f:
        await f.write(cert_pem)

    db_cert = File(
        filename=cert_filename,
        custom_name=data.custom_name,
        description=data.description,
        file_type=FileType.CERTIFICATE,
        file_path=cert_path,
        tags=tags_json,
        owner_id=current_user.id,
    )
    db.add(db_cert)

    # ── Save private key ───────────────────────────────────────────────────────
    key_filename = f"selfsigned_key_{current_user.id}_{ts}.pem"
    key_path = os.path.join(settings.SSL_FILES_DIR, key_filename)
    async with aiofiles.open(key_path, "wb") as f:
        await f.write(key_pem)

    db_key = File(
        filename=key_filename,
        custom_name=f"{data.custom_name}_chave_privada",
        description=f"Chave privada do certificado autoassinado: {data.custom_name}",
        file_type=FileType.PRIVATE_KEY,
        file_path=key_path,
        tags=tags_json,
        owner_id=current_user.id,
    )
    db.add(db_key)
    db.commit()
    db.refresh(db_cert)
    db.refresh(db_key)

    # Parse tags for response
    db_cert.tags = _parse_tags(db_cert.tags)
    db_key.tags = _parse_tags(db_key.tags)

    return SelfSignedCertResponse(
        certificate=FileResponse.model_validate(db_cert),
        private_key=FileResponse.model_validate(db_key),
    )
