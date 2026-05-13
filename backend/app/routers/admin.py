"""Admin router — full user management for administrators."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, File, SshKeyPair
from app.schemas import UserAdminView, UserAdminCreate, UserAdminUpdate, AdminResetPassword, UserAdminCreateResponse
from app.routers.auth import get_admin_user, get_password_hash
import secrets

router = APIRouter()


# ─── User listing & creation ──────────────────────────────────────────────────

@router.get("/users", response_model=List[UserAdminView])
async def list_users(
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """List all users in the system."""
    return db.query(User).order_by(User.created_at.desc()).all()


@router.post("/users", response_model=UserAdminCreateResponse, status_code=201)
async def create_user(
    data: UserAdminCreate,
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Create a new user (admin only) and auto-generate password."""
    existing = db.query(User).filter(
        (User.email == data.email) | (User.username == data.username)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="E-mail ou usuário já cadastrado.")

    if data.role not in ("admin", "user"):
        raise HTTPException(status_code=400, detail="Role inválido. Use 'admin' ou 'user'.")

    generated_password = secrets.token_urlsafe(12)

    new_user = User(
        email=data.email,
        username=data.username,
        full_name=data.full_name,
        hashed_password=get_password_hash(generated_password),
        role=data.role,
        is_active=True,
        force_password_change=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    setattr(new_user, "generated_password", generated_password)
    return new_user


# ─── Single user management ───────────────────────────────────────────────────

@router.get("/users/{user_id}", response_model=UserAdminView)
async def get_user(
    user_id: int,
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return user


@router.put("/users/{user_id}", response_model=UserAdminView)
async def update_user(
    user_id: int,
    data: UserAdminUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Update user attributes: role, is_active, force_password_change, email."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    # Prevent admin from demoting/deactivating themselves
    if user.id == admin.id:
        if data.is_active is False:
            raise HTTPException(status_code=400, detail="Você não pode desativar sua própria conta.")
        if data.role == "user":
            raise HTTPException(status_code=400, detail="Você não pode remover seu próprio papel de administrador.")

    if data.email is not None:
        # Check uniqueness
        clash = db.query(User).filter(User.email == data.email, User.id != user_id).first()
        if clash:
            raise HTTPException(status_code=400, detail="E-mail já utilizado por outro usuário.")
        user.email = data.email
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.role is not None:
        if data.role not in ("admin", "user"):
            raise HTTPException(status_code=400, detail="Role inválido.")
        user.role = data.role
    if data.force_password_change is not None:
        user.force_password_change = data.force_password_change

    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    data: AdminResetPassword,
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Reset a user's password (admin action). Forces password change on next login."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="A senha deve ter pelo menos 8 caracteres.")

    user.hashed_password = get_password_hash(data.new_password)
    user.force_password_change = data.force_change
    db.commit()
    return {"message": f"Senha do usuário '{user.username}' redefinida com sucesso."}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Delete a user and all their associated files and SSH keys.
    The admin cannot delete their own account.
    """
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Você não pode excluir sua própria conta.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    import os
    import logging
    logger = logging.getLogger(__name__)
    
    # Delete files from disk and DB
    for f in db.query(File).filter(File.owner_id == user_id).all():
        try:
            if os.path.exists(f.file_path):
                os.remove(f.file_path)
        except Exception as e:
            logger.error(f"Falha ao apagar arquivo {f.file_path} do usuário {user_id}: {e}")
        db.delete(f)

    # Delete SSH key pairs
    for kp in db.query(SshKeyPair).filter(SshKeyPair.owner_id == user_id).all():
        try:
            if os.path.exists(kp.private_key_path):
                os.remove(kp.private_key_path)
        except Exception as e:
            logger.error(f"Falha ao apagar chave SSH {kp.private_key_path} do usuário {user_id}: {e}")
        db.delete(kp)

    db.delete(user)
    db.commit()
    return {"message": f"Usuário '{user.username}' e todos os seus dados foram removidos."}


# ─── System stats ─────────────────────────────────────────────────────────────

@router.get("/stats")
async def admin_stats(
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """System-wide statistics for the admin dashboard."""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_files = db.query(File).count()
    total_ssh_keys = db.query(SshKeyPair).count()

    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
        "total_files": total_files,
        "total_ssh_keys": total_ssh_keys,
    }
