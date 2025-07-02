from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from app.models import FileType

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# File schemas
class FileBase(BaseModel):
    custom_name: str
    description: Optional[str] = None
    tags: Optional[List[str]] = []

class FileCreate(FileBase):
    file_type: FileType

class FileResponse(FileBase):
    id: int
    filename: str
    file_type: FileType
    owner_id: int
    created_at: datetime
    imported_at: datetime
    
    class Config:
        from_attributes = True

# CSR schemas
class CSRCreate(BaseModel):
    common_name: str
    country: str
    state: str
    locality: str
    organization: str
    organizational_unit: str
    email: EmailStr
    custom_name: str
    description: Optional[str] = None
    tags: Optional[List[str]] = []

# PFX schemas
class PFXCreate(BaseModel):
    certificate_id: int
    ca_bundle_id: int
    private_key_id: int
    custom_name: str
    description: Optional[str] = None
    tags: Optional[List[str]] = []

class PFXResponse(FileResponse):
    password_masked: str = "************************"
    
# Validation schemas
class ValidationRequest(BaseModel):
    file_content: Optional[str] = None
    file_id: Optional[int] = None
    password: Optional[str] = None

class ValidationResponse(BaseModel):
    file_type: str
    details: dict
    is_valid: bool
    error: Optional[str] = None