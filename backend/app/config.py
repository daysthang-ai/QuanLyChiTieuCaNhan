import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "FinTrack AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "fintrack-ai-super-secret-jwt-key-change-in-production-2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'fintrack.db'}"

    # AI Configuration
    AI_PROVIDER: str = "gemini"  # gemini, openai, ollama, smart_fallback
    GEMINI_API_KEY: str = "AQ.Ab8RN6JSod3YDU4ruYd2-bng6bq-w9fIVl2QcKOj8RFZf7KbpA"
    GEMINI_MODEL: str = "gemini-3.6-flash"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"

    # Uploads & Assets
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    PROMPTS_DIR: str = str(BASE_DIR / "prompts")
    MAX_UPLOAD_SIZE_MB: int = 5
    ALLOWED_EXTENSIONS: str = "png,jpg,jpeg,webp,pdf"

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure required directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
