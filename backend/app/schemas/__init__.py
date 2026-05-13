from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from app.models import FileType

# ─── Auth / User ──────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    email: str
    username: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    role: str
    is_active: bool
    force_password_change: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

# ─── Token ────────────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str
    force_password_change: bool = False
    role: str = "user"

class TokenData(BaseModel):
    username: Optional[str] = None

# ─── Password ─────────────────────────────────────────────────────────────────

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# ─── Admin user management ────────────────────────────────────────────────────

class UserAdminView(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    force_password_change: bool
    last_login: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class UserAdminCreate(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    role: str = "user"

class UserAdminCreateResponse(UserAdminView):
    generated_password: str

class UserAdminUpdate(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    role: Optional[str] = None
    force_password_change: Optional[bool] = None

class AdminResetPassword(BaseModel):
    new_password: str
    force_change: bool = True

# ─── File ─────────────────────────────────────────────────────────────────────

class FileBase(BaseModel):
    custom_name: str
    description: Optional[str] = None
    tags: Optional[List[str]] = []

class FileCreate(FileBase):
    file_type: FileType

class KeyCreate(FileBase):
    key_type: str = "RSA"   # RSA or EC
    key_size: int = 2048    # RSA: 2048/3072/4096 | EC: 256/384

class FileResponse(FileBase):
    id: int
    filename: str
    file_type: FileType
    owner_id: int
    created_at: datetime
    imported_at: datetime

    class Config:
        from_attributes = True

# ─── CSR ──────────────────────────────────────────────────────────────────────

class CSRCreate(BaseModel):
    common_name: str
    country: str
    state: str
    locality: str
    organization: str
    organizational_unit: str
    email: Optional[EmailStr] = None
    san_domains: Optional[List[str]] = []
    custom_name: str
    description: Optional[str] = None
    tags: Optional[List[str]] = []
    key_type: str = "RSA"   # RSA or EC
    key_size: int = 2048    # RSA: 2048/3072/4096 | EC: 256/384

# ─── PFX ──────────────────────────────────────────────────────────────────────

class PFXCreate(BaseModel):
    certificate_id: int
    ca_bundle_id: Optional[int] = None   # Optional: PFX sem CA bundle é válido
    private_key_id: int
    custom_name: str
    description: Optional[str] = None
    tags: Optional[List[str]] = []

class PFXResponse(FileResponse):
    password_masked: str = "************************"

# ─── Validation ───────────────────────────────────────────────────────────────

class ValidationRequest(BaseModel):
    file_content: Optional[str] = None
    file_id: Optional[int] = None
    password: Optional[str] = None

class ValidationResponse(BaseModel):
    file_type: str
    details: dict
    is_valid: bool
    error: Optional[str] = None

# ─── SSH Key Pairs ────────────────────────────────────────────────────────────

class SSHKeyCreate(BaseModel):
    key_type: str = "Ed25519"
    key_size: int = 4096
    comment: str = ""
    passphrase: Optional[str] = None
    custom_name: str
    description: Optional[str] = None
    tags: Optional[List[str]] = []

class SSHKeyResponse(BaseModel):
    id: int
    custom_name: str
    description: Optional[str]
    tags: Optional[List[str]] = []
    key_type: str
    key_size: Optional[int]
    comment: str
    has_passphrase: bool
    public_key_content: str
    private_key_filename: str
    created_at: datetime

    class Config:
        from_attributes = True

# ─── App Certificates (self-signed) ───────────────────────────────────────────

class SelfSignedCertCreate(BaseModel):
    common_name: str
    organization: str = ""
    organizational_unit: str = ""
    country: str = "BR"
    state: str = ""
    locality: str = ""
    email: Optional[EmailStr] = None
    san_domains: Optional[List[str]] = []
    validity_days: int = 365          # 1–3650 days
    key_type: str = "RSA"
    key_size: int = 2048
    custom_name: str
    description: Optional[str] = None
    tags: Optional[List[str]] = []

class SelfSignedCertResponse(BaseModel):
    certificate: FileResponse
    private_key: FileResponse

# ─── Shares ───────────────────────────────────────────────────────────────────

class ShareCreate(BaseModel):
    file_id: int
    target_email: str

class SharedFileResponse(BaseModel):
    id: int
    file_id: int
    owner_id: int
    shared_with_user_id: int
    created_at: datetime
    
    file: FileResponse
    owner_email: str
    shared_with_email: str

    class Config:
        from_attributes = True
