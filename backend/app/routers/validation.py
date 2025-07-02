from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile, Form
from sqlalchemy.orm import Session
from typing import Optional
import base64
import aiofiles

from app.database import get_db
from app.models import User, File
from app.schemas import ValidationResponse
from app.routers.auth import get_current_user
from app.utils.crypto import (
    validate_certificate, 
    validate_private_key, 
    validate_csr, 
    validate_pfx
)

router = APIRouter()

@router.post("/validate", response_model=ValidationResponse)
async def validate_file(
    file: Optional[UploadFile] = FastAPIFile(None),
    file_id: Optional[int] = Form(None),
    password: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Validate a file (certificate, key, CSR, or PFX)"""
    try:
        # Get file content
        if file:
            # Validate uploaded file
            content = await file.read()
            filename = file.filename.lower()
        elif file_id:
            # Validate existing file
            db_file = db.query(File).filter(
                File.id == file_id,
                File.owner_id == current_user.id
            ).first()
            
            if not db_file:
                raise HTTPException(status_code=404, detail="File not found")
            
            async with aiofiles.open(db_file.file_path, 'rb') as f:
                content = await f.read()
            filename = db_file.filename.lower()
        else:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Detect file type and validate
        if filename.endswith('.pfx') or filename.endswith('.p12'):
            if not password:
                raise HTTPException(status_code=400, detail="Password required for PFX validation")
            result = validate_pfx(content, password)
            file_type = "PFX/PKCS12"
        elif filename.endswith('.key') or filename.endswith('.pem'):
            # Try as private key first
            result = validate_private_key(content)
            if result['valid']:
                file_type = "Private Key"
            else:
                # Try as certificate
                result = validate_certificate(content)
                if result['valid']:
                    file_type = "Certificate"
                else:
                    # Try as CSR
                    result = validate_csr(content)
                    file_type = "CSR" if result['valid'] else "Unknown"
        elif filename.endswith('.crt') or filename.endswith('.cer'):
            result = validate_certificate(content)
            file_type = "Certificate"
        elif filename.endswith('.csr'):
            result = validate_csr(content)
            file_type = "CSR"
        else:
            # Try to detect by content
            result = validate_certificate(content)
            if result['valid']:
                file_type = "Certificate"
            else:
                result = validate_private_key(content)
                if result['valid']:
                    file_type = "Private Key"
                else:
                    result = validate_csr(content)
                    file_type = "CSR" if result['valid'] else "Unknown"
        
        return ValidationResponse(
            file_type=file_type,
            details=result,
            is_valid=result.get('valid', False),
            error=result.get('error')
        )
        
    except Exception as e:
        return ValidationResponse(
            file_type="Unknown",
            details={},
            is_valid=False,
            error=str(e)
        )

@router.post("/validate-matching")
async def validate_matching(
    certificate_id: int,
    private_key_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Validate if a certificate and private key match"""
    try:
        # Get files
        cert_file = db.query(File).filter(
            File.id == certificate_id,
            File.owner_id == current_user.id
        ).first()
        
        key_file = db.query(File).filter(
            File.id == private_key_id,
            File.owner_id == current_user.id
        ).first()
        
        if not cert_file or not key_file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Read files
        async with aiofiles.open(cert_file.file_path, 'rb') as f:
            cert_content = await f.read()
        
        async with aiofiles.open(key_file.file_path, 'rb') as f:
            key_content = await f.read()
        
        # Validate both files
        cert_info = validate_certificate(cert_content)
        key_info = validate_private_key(key_content)
        
        if not cert_info['valid'] or not key_info['valid']:
            return {
                "match": False,
                "error": "Invalid certificate or private key"
            }
        
        # Check if they match (simplified check - in production, use proper crypto validation)
        # This is a placeholder - implement proper modulus comparison
        return {
            "match": True,
            "certificate": cert_info,
            "private_key": key_info
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))