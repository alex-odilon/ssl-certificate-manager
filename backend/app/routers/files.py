import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import csv
import io
import json
import os

from app.database import get_db
from app.models import User, File, FileType, PfxPassword
from app.schemas import FileResponse
from app.routers.auth import get_current_user

router = APIRouter()
logger = logging.getLogger("ssl_manager.files")


def _parse_tags(raw) -> list:
    if not raw:
        return []
    if isinstance(raw, list):
        return raw
    try:
        return json.loads(raw)
    except Exception:
        return []


@router.get("/", response_model=List[FileResponse])
async def list_all_files(
    file_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all files for the current user with optional filters."""
    query = db.query(File).filter(File.owner_id == current_user.id)

    if file_type:
        try:
            ft = FileType(file_type)
            query = query.filter(File.file_type == ft)
        except ValueError:
            raise HTTPException(status_code=400, detail="Tipo de arquivo inválido.")

    if search:
        term = f"%{search}%"
        query = query.filter(
            (File.custom_name.ilike(term)) |
            (File.description.ilike(term)) |
            (File.tags.ilike(term))
        )

    files = query.order_by(File.created_at.desc()).all()
    for f in files:
        f.tags = _parse_tags(f.tags)
    return files


@router.get("/export")
async def export_files_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export all files as CSV."""
    files = db.query(File).filter(
        File.owner_id == current_user.id
    ).order_by(File.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Nome", "Tipo", "Descrição", "Tags", "Criado em", "Importado em"])

    for f in files:
        tags = _parse_tags(f.tags)
        writer.writerow([
            f.custom_name,
            f.file_type.value,
            f.description or "",
            ", ".join(tags),
            f.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            f.imported_at.strftime("%Y-%m-%d %H:%M:%S"),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="meus_arquivos_ssl.csv"'},
    )


@router.get("/stats")
async def get_file_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get statistics about user's files."""
    stats = {}
    for file_type in FileType:
        stats[file_type.value] = db.query(File).filter(
            File.owner_id == current_user.id,
            File.file_type == file_type
        ).count()
    stats['total'] = db.query(File).filter(File.owner_id == current_user.id).count()
    return stats


@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a file from the database and disk."""
    file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == current_user.id
    ).first()

    if not file:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")

    file_path = file.file_path

    try:
        if file.file_type == FileType.PFX:
            pfx_password = db.query(PfxPassword).filter(PfxPassword.file_id == file_id).first()
            if pfx_password:
                db.delete(pfx_password)

        db.delete(file)
        db.commit()

        if os.path.exists(file_path):
            os.remove(file_path)

        return {"message": "Arquivo deletado com sucesso.", "id": file_id}

    except HTTPException:
        raise
    except Exception:
        db.rollback()
        logger.error("File deletion failed", exc_info=True, extra={"file_id": file_id, "user_id": current_user.id})
        raise HTTPException(status_code=500, detail="Erro ao deletar arquivo. Contate o administrador.")


@router.put("/{file_id}")
async def update_file(
    file_id: int,
    custom_name: Optional[str] = None,
    description: Optional[str] = None,
    tags: Optional[List[str]] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update file metadata."""
    file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == current_user.id
    ).first()

    if not file:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")

    if custom_name is not None:
        file.custom_name = custom_name
    if description is not None:
        file.description = description
    if tags is not None:
        file.tags = json.dumps(tags)

    db.commit()
    db.refresh(file)
    file.tags = _parse_tags(file.tags)
    return file
