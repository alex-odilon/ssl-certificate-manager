from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://sslmanager:sslmanager123@localhost:5432/sslmanager"
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    SSL_FILES_DIR: str = "/app/ssl_files"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost"
    
    # Admin User Configuration
    ADMIN_EMAIL: str = "admin@example.com"
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123" # Should be overridden in production
    
    class Config:
        env_file = ".env"

settings = Settings()