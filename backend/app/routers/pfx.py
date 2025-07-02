from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse as FastAPIFileResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import os
import json
import aiofiles
from cryptography.fernet import Fernet

from app.database import get_db
from app.models import User, File, FileType, PfxPassword
from app.schemas import PFXCreate, PFXResponse
from app.routers.auth import get_current_user
from app.utils.crypto import create_pfx, generate_password
from app.config import settings

router = APIRouter()

# Use a fixed key for encryption (in production, use a proper key management system)
ENCRYPTION_KEY = Fernet.generate_key()
fernet = Fernet(ENCRYPTION_KEY)

@router.post("/generate", response_model=PFXResponse)
async def generate_pfx_endpoint(
    pfx_data: PFXCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a PFX file from certificate, CA bundle, and private key"""
    try:
        # Validate that all files belong to the user
        certificate = db.query(File).filter(
            File.id == pfx_data.certificate_id,
            File.owner_id == current_user.id,
            File.file_type == FileType.CERTIFICATE
        ).first()
        
        ca_bundle = db.query(File).filter(
            File.id == pfx_data.ca_bundle_id,
            File.owner_id == current_user.id,
            File.file_type == FileType.CA_BUNDLE
        ).first()
        
        private_key = db.query(File).filter(
            File.id == pfx_data.private_key_id,
            File.owner_id == current_user.id,
            File.file_type == FileType.PRIVATE_KEY
        ).first()
        
        if not all([certificate, ca_bundle, private_key]):
            raise HTTPException(status_code=404, detail="One or more files not found")
        
        # Read file contents
        async with aiofiles.open(certificate.file_path, 'rb') as f:
            cert_pem = await f.read()
        
        async with aiofiles.open(ca_bundle.file_path, 'rb') as f:
            ca_pem = await f.read()
        
        async with aiofiles.open(private_key.file_path, 'rb') as f:
            key_pem = await f.read()
        
        # Generate password
        password = generate_password()
        
        # Create PFX
        pfx_data_bytes = create_pfx(cert_pem, key_pem, ca_pem, password)
        
        # Save PFX file
        pfx_filename = f"pfx_{current_user.id}_{int(datetime.utcnow().timestamp())}.pfx"
        pfx_path = os.path.join(settings.SSL_FILES_DIR, pfx_filename)
        
        async with aiofiles.open(pfx_path, 'wb') as f:
            await f.write(pfx_data_bytes)
        
        # Save to database
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
        db.flush()  # Get the ID before committing
        
        # Save encrypted password
        encrypted_password = fernet.encrypt(password.encode())
        db_password = PfxPassword(
            file_id=db_pfx.id,
            encrypted_password=encrypted_password.decode()
        )
        db.add(db_password)
        
        db.commit()
        db.refresh(db_pfx)
        
        # Convert tags from JSON string to list
        if db_pfx.tags:
            try:
                db_pfx.tags = json.loads(db_pfx.tags)
            except:
                db_pfx.tags = []
        else:
            db_pfx.tags = []
        
        # Return response with password (only this time)
        response = PFXResponse.from_orm(db_pfx)
        response.password_masked = password  # Show password once
        
        return response
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[PFXResponse])
async def list_pfx_files(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all PFX files for the current user"""
    pfx_files = db.query(File).filter(
        File.owner_id == current_user.id,
        File.file_type == FileType.PFX
    ).all()
    
    # Convert to response model with masked passwords
    responses = []
    for pfx in pfx_files:
        # Convert tags from JSON string to list
        if pfx.tags:
            try:
                pfx.tags = json.loads(pfx.tags)
            except:
                pfx.tags = []
        else:
            pfx.tags = []
        
        response = PFXResponse.from_orm(pfx)
        responses.append(response)
    
    return responses

@router.get("/{pfx_id}/password")
async def get_pfx_password(
    pfx_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the password for a PFX file (decrypted but not shown)"""
    pfx_file = db.query(File).filter(
        File.id == pfx_id,
        File.owner_id == current_user.id,
        File.file_type == FileType.PFX
    ).first()
    
    if not pfx_file:
        raise HTTPException(status_code=404, detail="PFX file not found")
    
    password_record = db.query(PfxPassword).filter(
        PfxPassword.file_id == pfx_id
    ).first()
    
    if not password_record:
        raise HTTPException(status_code=404, detail="Password not found")
    
    # Decrypt password
    decrypted_password = fernet.decrypt(password_record.encrypted_password.encode()).decode()
    
    # Return masked password with copy functionality handled by frontend
    return {
        "password": decrypted_password,
        "masked": "*" * 25
    }

@router.get("/{pfx_id}/download")
async def download_pfx(
    pfx_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a PFX file"""
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