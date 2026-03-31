from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"


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
    role = Column(String, default="user", nullable=False)          # "admin" | "user"
    is_active = Column(Boolean, default=True, nullable=False)
    force_password_change = Column(Boolean, default=False, nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    files = relationship("File", back_populates="owner")
    ssh_key_pairs = relationship("SshKeyPair", back_populates="owner")


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


class SshKeyPair(Base):
    """Stores an SSH key pair (private key on disk, public key in DB)."""
    __tablename__ = "ssh_key_pairs"

    id = Column(Integer, primary_key=True, index=True)
    custom_name = Column(String, nullable=False)
    description = Column(Text)
    tags = Column(Text)                        # JSON string

    key_type = Column(String, nullable=False)  # RSA | ECDSA | Ed25519
    key_size = Column(Integer)                 # bits — None for Ed25519
    comment = Column(String, default="")       # e.g. user@hostname

    has_passphrase = Column(Boolean, default=False, nullable=False)

    private_key_filename = Column(String, nullable=False)
    private_key_path = Column(String, nullable=False)
    public_key_content = Column(Text, nullable=False)  # authorized_keys format

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="ssh_key_pairs")
