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
from app.schemas import FileCreate, FileResponse
from app.routers.auth import get_current_user
from app.utils.crypto import generate_private_key, validate_private_key
from app.config import settings

router = APIRouter()

@router.post("/generate", response_model=FileResponse)
async def generate_key(
    file_data: FileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a new private key"""
    try:
        # Generate private key
        private_key_pem = generate_private_key()
        
        # Save to file
        filename = f"private_key_{current_user.id}_{int(datetime.utcnow().timestamp())}.pem"
        file_path = os.path.join(settings.SSL_FILES_DIR, filename)
        
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(private_key_pem)
        
        # Save to database
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
        
        return db_file
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload", response_model=FileResponse)
async def upload_key(
    file: UploadFile = FastAPIFile(...),
    custom_name: str = Form(...),
    description: str = Form(None),
    tags: str = Form("[]"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a private key file"""
    try:
        # Read file content
        content = await file.read()
        
        # Validate private key
        validation = validate_private_key(content)
        if not validation['valid']:
            raise HTTPException(status_code=400, detail=f"Invalid private key: {validation.get('error', 'Unknown error')}")
        
        # Save to file
        filename = f"uploaded_key_{current_user.id}_{int(datetime.utcnow().timestamp())}.pem"
        file_path = os.path.join(settings.SSL_FILES_DIR, filename)
        
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Save to database
        db_file = File(
            filename=filename,
            custom_name=custom_name,
            description=description,
            file_type=FileType.PRIVATE_KEY,
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
async def list_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all private keys for the current user"""
    keys = db.query(File).filter(
        File.owner_id == current_user.id,
        File.file_type == FileType.PRIVATE_KEY
    ).all()
    return keys

@router.get("/{key_id}/download")
async def download_key(
    key_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a private key file"""
    key_file = db.query(File).filter(
        File.id == key_id,
        File.owner_id == current_user.id,
        File.file_type == FileType.PRIVATE_KEY
    ).first()
    
    if not key_file:
        raise HTTPException(status_code=404, detail="Private key not found")
    
    if not os.path.exists(key_file.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FastAPIFileResponse(
        path=key_file.file_path,
        filename=key_file.custom_name + ".pem",
        media_type="application/x-pem-file"
    )