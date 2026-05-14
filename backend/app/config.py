from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://sslmanager:sslmanager123@localhost:5432/sslmanager"
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ENCRYPTION_KEY: str = ""  # Separate key for encrypting files/PFX — distinct from JWT SECRET_KEY
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    SSL_FILES_DIR: str = "/app/ssl_files"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost"
    ENABLE_DOCS: bool = False  # Set to True only in development

    # Admin User Configuration
    ADMIN_EMAIL: str = "admin@example.com"
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"

    class Config:
        env_file = ".env"

settings = Settings()