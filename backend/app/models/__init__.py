from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class FileType(str, enum.Enum):
    PRIVATE_KEY = "private_key"
    CERTIFICATE = "certificate"
    CSR = "csr"
    PFX = "pfx"
    CA_BUNDLE = "ca_bundle"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    files = relationship("File", back_populates="owner")

class File(Base):
    __tablename__ = "files"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    custom_name = Column(String, nullable=False)
    description = Column(Text)
    file_type = Column(SQLEnum(FileType), nullable=False)
    file_path = Column(String, nullable=False)
    tags = Column(Text)  # JSON string
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    imported_at = Column(DateTime(timezone=True), server_default=func.now())
    
    owner = relationship("User", back_populates="files")
    pfx_password = relationship("PfxPassword", back_populates="file", uselist=False)

class PfxPassword(Base):
    __tablename__ = "pfx_passwords"
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), unique=True, nullable=False)
    encrypted_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    file = relationship("File", back_populates="pfx_password")