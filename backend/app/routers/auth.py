import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.database import get_db
from app.models import User
from app.schemas import Token, TokenData, User as UserSchema, ChangePasswordRequest
from app.config import settings
from app.rate_limit import limiter

router = APIRouter()
logger = logging.getLogger("ssl_manager.auth")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

_MAX_ATTEMPTS = 3


# ─── helpers ──────────────────────────────────────────────────────────────────

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


# ─── dependencies ─────────────────────────────────────────────────────────────

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Conta desativada. Contate o administrador.")
    return user


async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores.",
        )
    return current_user


# ─── endpoints ────────────────────────────────────────────────────────────────

@router.post("/register", response_model=UserSchema)
async def register():
    raise HTTPException(status_code=403, detail="O registro público está desabilitado. Solicite acesso a um administrador.")


@router.post("/token", response_model=Token)
@limiter.limit("15/minute")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.username == form_data.username).first()

    if user and user.login_locked:
        logger.warning("Login blocked — account locked", extra={
            "event": "user.login_locked",
            "username": form_data.username,
            "ip": request.client.host if request.client else None,
        })
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta bloqueada por excesso de tentativas incorretas. Entre em contato com o administrador.",
        )

    if user and not user.is_active:
        raise HTTPException(status_code=403, detail="Conta desativada. Contate o administrador.")

    password_ok = user is not None and verify_password(form_data.password, user.hashed_password)

    if not password_ok:
        if user:
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            remaining = max(0, _MAX_ATTEMPTS - user.failed_login_attempts)

            if user.failed_login_attempts >= _MAX_ATTEMPTS:
                user.login_locked = True
                db.commit()
                logger.warning("Account locked after failed attempts", extra={
                    "event": "user.account_locked",
                    "user_id": user.id,
                    "username": user.username,
                    "ip": request.client.host if request.client else None,
                })
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Conta bloqueada por excesso de tentativas incorretas. Entre em contato com o administrador.",
                )

            db.commit()
            logger.warning("Login failed — wrong password", extra={
                "event": "user.login_failed",
                "user_id": user.id,
                "username": user.username,
                "attempts": user.failed_login_attempts,
                "remaining": remaining,
                "ip": request.client.host if request.client else None,
            })

            detail = "Senha incorreta. Esta é sua última tentativa." if remaining == 1 \
                else f"Senha incorreta. Você tem {remaining} tentativa(s) restante(s)."

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=detail,
                headers={"WWW-Authenticate": "Bearer"},
            )

        logger.warning("Login failed — user not found", extra={
            "event": "user.login_not_found",
            "username": form_data.username,
            "ip": request.client.host if request.client else None,
        })
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha incorretos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user.failed_login_attempts = 0
    user.last_login = datetime.utcnow()
    db.commit()

    logger.info("User logged in", extra={
        "event": "user.login_success",
        "user_id": user.id,
        "username": user.username,
        "role": user.role,
        "ip": request.client.host if request.client else None,
    })

    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        force_password_change=user.force_password_change,
        role=user.role,
    )


@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Senha atual incorreta.")
    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="A nova senha deve ter pelo menos 8 caracteres.")
    current_user.hashed_password = get_password_hash(request.new_password)
    current_user.force_password_change = False
    db.commit()
    logger.info("Password changed", extra={"event": "user.password_changed", "user_id": current_user.id})
    return {"message": "Senha alterada com sucesso."}
