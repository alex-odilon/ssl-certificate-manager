from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile, Form
from fastapi.responses import FileResponse as FastAPIFileResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import os
import json
import aiofiles

from app.database import get_db
from app.models import User, File, FileType
from app.schemas import FileResponse
from app.routers.auth import get_current_user
from app.utils.crypto import validate_certificate
from app.config import settings

router = APIRouter()

@router.post("/upload", response_model=FileResponse)
async def upload_certificate(
    file: UploadFile = FastAPIFile(...),
    custom_name: str = Form(...),
    description: str = Form(None),
    tags: str = Form("[]"),
    file_type: str = Form(...),  # 'certificate' or 'ca_bundle'
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a certificate or CA bundle file"""
    try:
        # Validate file type
        if file_type not in ['certificate', 'ca_bundle']:
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        # Read file content
        content = await file.read()
        
        # Validate certificate
        validation = validate_certificate(content)
        if not validation['valid']:
            raise HTTPException(status_code=400, detail=f"Invalid certificate: {validation.get('error', 'Unknown error')}")
        
        # Determine FileType enum
        db_file_type = FileType.CERTIFICATE if file_type == 'certificate' else FileType.CA_BUNDLE
        
        # Save to file
        filename = f"{file_type}_{current_user.id}_{int(datetime.utcnow().timestamp())}.pem"
        file_path = os.path.join(settings.SSL_FILES_DIR, filename)
        
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Save to database
        db_file = File(
            filename=filename,
            custom_name=custom_name,
            description=description,
            file_type=db_file_type,
            file_path=file_path,
            tags=tags,
            owner_id=current_user.id
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        
        return db_file
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[FileResponse])
async def list_certificates(
    file_type: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List certificates and/or CA bundles for the current user"""
    query = db.query(File).filter(File.owner_id == current_user.id)
    
    if file_type == 'certificate':
        query = query.filter(File.file_type == FileType.CERTIFICATE)
    elif file_type == 'ca_bundle':
        query = query.filter(File.file_type == FileType.CA_BUNDLE)
    else:
        query = query.filter(File.file_type.in_([FileType.CERTIFICATE, FileType.CA_BUNDLE]))
    
    certificates = query.all()
    return certificates

@router.get("/{cert_id}/download")
async def download_certificate(
    cert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a certificate or CA bundle file"""
    cert_file = db.query(File).filter(
        File.id == cert_id,
        File.owner_id == current_user.id,
        File.file_type.in_([FileType.CERTIFICATE, FileType.CA_BUNDLE])
    ).first()
    
    if not cert_file:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    if not os.path.exists(cert_file.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    extension = ".crt" if cert_file.file_type == FileType.CERTIFICATE else ".pem"
    
    return FastAPIFileResponse(
        path=cert_file.file_path,
        filename=cert_file.custom_name + extension,
        media_type="application/x-pem-file"
    )