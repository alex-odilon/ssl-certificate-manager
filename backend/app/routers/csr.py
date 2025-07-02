from fastapi import APIRouter, Depends, HTTPException, Response
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
from app.config import settings

router = APIRouter()

@router.post("/generate", response_model=FileResponse)
async def generate_csr_endpoint(
    csr_data: CSRCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a new CSR and its corresponding private key"""
    try:
        # Generate private key first
        private_key_pem = generate_private_key()
        
        # Generate CSR
        csr_pem = generate_csr(private_key_pem, csr_data.dict())
        
        # Save private key
        key_filename = f"csr_private_key_{current_user.id}_{int(datetime.utcnow().timestamp())}.pem"
        key_path = os.path.join(settings.SSL_FILES_DIR, key_filename)
        
        async with aiofiles.open(key_path, 'wb') as f:
            await f.write(private_key_pem)
        
        # Save private key to database
        db_key = File(
            filename=key_filename,
            custom_name=f"{csr_data.custom_name}_private_key",
            description=f"Private key for CSR: {csr_data.custom_name}",
            file_type=FileType.PRIVATE_KEY,
            file_path=key_path,
            tags=json.dumps(csr_data.tags) if csr_data.tags else "[]",
            owner_id=current_user.id
        )
        db.add(db_key)
        
        # Save CSR
        csr_filename = f"csr_{current_user.id}_{int(datetime.utcnow().timestamp())}.csr"
        csr_path = os.path.join(settings.SSL_FILES_DIR, csr_filename)
        
        async with aiofiles.open(csr_path, 'wb') as f:
            await f.write(csr_pem)
        
        # Save CSR to database
        db_csr = File(
            filename=csr_filename,
            custom_name=csr_data.custom_name,
            description=csr_data.description,
            file_type=FileType.CSR,
            file_path=csr_path,
            tags=json.dumps(csr_data.tags) if csr_data.tags else "[]",
            owner_id=current_user.id
        )
        db.add(db_csr)
        
        db.commit()
        db.refresh(db_csr)
        
        return db_csr
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[FileResponse])
async def list_csrs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all CSRs for the current user"""
    csrs = db.query(File).filter(
        File.owner_id == current_user.id,
        File.file_type == FileType.CSR
    ).all()
    return csrs

@router.get("/{csr_id}/download")
async def download_csr(
    csr_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a CSR file"""
    csr_file = db.query(File).filter(
        File.id == csr_id,
        File.owner_id == current_user.id,
        File.file_type == FileType.CSR
    ).first()
    
    if not csr_file:
        raise HTTPException(status_code=404, detail="CSR not found")
    
    if not os.path.exists(csr_file.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FastAPIFileResponse(
        path=csr_file.file_path,
        filename=csr_file.custom_name + ".csr",
        media_type="application/x-pem-file"
    )