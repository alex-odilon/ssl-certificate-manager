from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, File, SharedFile
from app.schemas import ShareCreate, SharedFileResponse, FileResponse
from app.routers.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=dict)
async def share_file(
    data: ShareCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify if file exists and belongs to current user
    file = db.query(File).filter(File.id == data.file_id, File.owner_id == current_user.id).first()
    if not file:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado ou você não é o dono.")

    # Find target user by email
    target_user = db.query(User).filter(User.email == data.target_email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário destino não encontrado.")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Você não pode compartilhar um arquivo com você mesmo.")

    # Check if already shared
    existing_share = db.query(SharedFile).filter(
        SharedFile.file_id == file.id,
        SharedFile.shared_with_user_id == target_user.id
    ).first()

    if existing_share:
        return {"message": "O arquivo já está compartilhado com este usuário."}

    # Create share
    new_share = SharedFile(
        file_id=file.id,
        owner_id=current_user.id,
        shared_with_user_id=target_user.id
    )
    db.add(new_share)
    db.commit()

    return {"message": f"Arquivo compartilhado com {target_user.email} sucesso!"}


@router.get("/shared-with-me", response_model=List[SharedFileResponse])
async def get_shared_with_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shares = db.query(SharedFile).filter(SharedFile.shared_with_user_id == current_user.id).all()
    
    # Format response
    response = []
    for share in shares:
        if not share.file: continue
        response.append({
            "id": share.id,
            "file_id": share.file_id,
            "owner_id": share.owner_id,
            "shared_with_user_id": share.shared_with_user_id,
            "created_at": share.created_at,
            "file": share.file,
            "owner_email": share.owner.email if share.owner else "",
            "shared_with_email": share.shared_with_user.email if share.shared_with_user else ""
        })
    return response


@router.get("/shared-by-me", response_model=List[SharedFileResponse])
async def get_shared_by_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shares = db.query(SharedFile).filter(SharedFile.owner_id == current_user.id).all()
    
    response = []
    for share in shares:
        if not share.file: continue
        response.append({
            "id": share.id,
            "file_id": share.file_id,
            "owner_id": share.owner_id,
            "shared_with_user_id": share.shared_with_user_id,
            "created_at": share.created_at,
            "file": share.file,
            "owner_email": share.owner.email if share.owner else "",
            "shared_with_email": share.shared_with_user.email if share.shared_with_user else ""
        })
    return response


@router.delete("/{file_id}/revoke/{user_id}")
async def revoke_share(
    file_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Owner revokes the share
    share = db.query(SharedFile).filter(
        SharedFile.file_id == file_id,
        SharedFile.shared_with_user_id == user_id,
        SharedFile.owner_id == current_user.id
    ).first()

    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento não encontrado.")

    db.delete(share)
    db.commit()
    return {"message": "Compartilhamento revogado com sucesso."}


@router.delete("/shared-with-me/{file_id}")
async def remove_from_my_view(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Recipient removes the share from their view
    share = db.query(SharedFile).filter(
        SharedFile.file_id == file_id,
        SharedFile.shared_with_user_id == current_user.id
    ).first()

    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento não encontrado.")

    db.delete(share)
    db.commit()
    return {"message": "Arquivo removido da sua visualização."}
