"""Admin router — full user management for administrators."""
import logging
import os
import secrets
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, File, SshKeyPair
from app.schemas import UserAdminView, UserAdminCreate, UserAdminUpdate, AdminResetPassword, UserAdminCreateResponse
from app.routers.auth import get_admin_user, get_password_hash
from app.utils.audit import record as audit

router = APIRouter()
logger = logging.getLogger("ssl_manager.admin")


@router.get("/users", response_model=List[UserAdminView])
async def list_users(
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.post("/users", response_model=UserAdminCreateResponse, status_code=201)
async def create_user(
    data: UserAdminCreate,
    request: Request,
    admin: User = Depends(get_admin_user),
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

    logger.info("Admin created user", extra={
        "event": "admin.user_created",
        "admin_id": admin.id,
        "new_username": new_user.username,
    })
    audit(db, user_id=admin.id, action="user.created", resource_type="user",
          resource_id=new_user.id, ip_address=request.client.host if request.client else None)

    setattr(new_user, "generated_password", generated_password)
    return new_user


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
    """Update user attributes."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    if user.id == admin.id:
        if data.is_active is False:
            raise HTTPException(status_code=400, detail="Você não pode desativar sua própria conta.")
        if data.role == "user":
            raise HTTPException(status_code=400, detail="Você não pode remover seu próprio papel de administrador.")

    if data.email is not None:
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


@router.post("/users/{user_id}/unlock")
async def unlock_user(
    user_id: int,
    request: Request,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Unlock a locked account and generate a new temporary password."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    new_password = secrets.token_urlsafe(12)
    user.login_locked = False
    user.failed_login_attempts = 0
    user.is_active = True
    user.hashed_password = get_password_hash(new_password)
    user.force_password_change = True
    db.commit()

    logger.info("User unlocked by admin", extra={
        "event": "admin.user_unlocked",
        "admin_id": admin.id,
        "target_user_id": user_id,
        "username": user.username,
    })
    audit(db, user_id=admin.id, action="user.unlocked", resource_type="user",
          resource_id=user_id, ip_address=request.client.host if request.client else None)

    return {"generated_password": new_password, "message": f"Usuário '{user.username}' desbloqueado com sucesso."}


@router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    data: AdminResetPassword,
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Reset a user's password (admin action)."""
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
    request: Request,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Delete a user and all their associated files and SSH keys."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Você não pode excluir sua própria conta.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    username = user.username

    for f in db.query(File).filter(File.owner_id == user_id).all():
        try:
            if os.path.exists(f.file_path):
                os.remove(f.file_path)
        except Exception as exc:
            logger.error("Failed to delete file from disk", extra={"path": f.file_path, "error": str(exc)})
        db.delete(f)

    for kp in db.query(SshKeyPair).filter(SshKeyPair.owner_id == user_id).all():
        try:
            if os.path.exists(kp.private_key_path):
                os.remove(kp.private_key_path)
        except Exception as exc:
            logger.error("Failed to delete SSH key from disk", extra={"path": kp.private_key_path, "error": str(exc)})
        db.delete(kp)

    db.delete(user)
    db.commit()

    logger.info("Admin deleted user", extra={
        "event": "admin.user_deleted",
        "admin_id": admin.id,
        "deleted_username": username,
    })
    audit(db, user_id=admin.id, action="user.deleted", resource_type="user",
          resource_id=user_id, details=username,
          ip_address=request.client.host if request.client else None)

    return {"message": f"Usuário '{username}' e todos os seus dados foram removidos."}


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
