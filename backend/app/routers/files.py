from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json

from app.database import get_db
from app.models import User, File, FileType
from app.schemas import FileResponse
from app.routers.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[FileResponse])
async def list_all_files(
    file_type: Optional[str] = Query(None, description="Filter by file type"),
    search: Optional[str] = Query(None, description="Search in name, description, or tags"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all files for the current user with optional filters"""
    query = db.query(File).filter(File.owner_id == current_user.id)
    
    # Filter by file type
    if file_type:
        try:
            ft = FileType(file_type)
            query = query.filter(File.file_type == ft)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid file type")
    
    # Search functionality
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (File.custom_name.ilike(search_term)) |
            (File.description.ilike(search_term)) |
            (File.tags.ilike(search_term))
        )
    
    # Order by creation date (newest first)
    files = query.order_by(File.created_at.desc()).all()
    
    # Parse tags from JSON string
    for file in files:
        if file.tags:
            try:
                file.tags = json.loads(file.tags)
            except:
                file.tags = []
        else:
            file.tags = []
    
    return files

@router.get("/stats")
async def get_file_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get statistics about user's files"""
    stats = {}
    
    for file_type in FileType:
        count = db.query(File).filter(
            File.owner_id == current_user.id,
            File.file_type == file_type
        ).count()
        stats[file_type.value] = count
    
    total = db.query(File).filter(File.owner_id == current_user.id).count()
    stats['total'] = total
    
    return stats

@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a file"""
    file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == current_user.id
    ).first()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Delete from database
    db.delete(file)
    db.commit()
    
    # Note: In production, you might also want to delete the actual file from disk
    # But for safety, we'll keep them for now
    
    return {"message": "File deleted successfully"}

@router.put("/{file_id}")
async def update_file(
    file_id: int,
    custom_name: Optional[str] = None,
    description: Optional[str] = None,
    tags: Optional[List[str]] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update file metadata"""
    file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == current_user.id
    ).first()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Update fields if provided
    if custom_name is not None:
        file.custom_name = custom_name
    if description is not None:
        file.description = description
    if tags is not None:
        file.tags = json.dumps(tags)
    
    db.commit()
    db.refresh(file)
    
    return file