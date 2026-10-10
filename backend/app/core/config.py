import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "PrepAI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database - Default to local SQLite file for immediate zero-config execution, 
    # or PostgreSQL when configured via DATABASE_URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./prepai.db")
    
    # JWT Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "prepai-super-secure-dev-secret-key-change-in-prod-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # LLM Provider Configuration
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openai")  # openai, anthropic, gemini, groq, local
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY", None)
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY", None)
    OPENAI_BASE_URL: Optional[str] = os.getenv("OPENAI_BASE_URL", None)
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    
    # Embeddings
    EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "local")  # openai, local
    
    # Audio / Speech
    SPEECH_TO_TEXT_API_KEY: Optional[str] = os.getenv("SPEECH_TO_TEXT_API_KEY", None)
    TEXT_TO_SPEECH_API_KEY: Optional[str] = os.getenv("TEXT_TO_SPEECH_API_KEY", None)
    
    # Max Upload Size (10MB)
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024

    class Config:
        env_file = (".env", "../.env")
        extra = "allow"

settings = Settings()
