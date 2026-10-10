from fastapi import APIRouter
from app.core.config import settings
from app.services.llm_service import llm_service
from app.schemas.schemas import ConfigStatusResponse

router = APIRouter(prefix="/config", tags=["System Configuration"])

@router.get("/status", response_model=ConfigStatusResponse)
def get_config_status():
    is_sqlite = settings.DATABASE_URL.startswith("sqlite")
    llm_info = llm_service.get_status_info()

    return ConfigStatusResponse(
        database_status="connected",
        database_type="SQLite (Local Dev)" if is_sqlite else "PostgreSQL",
        llm_provider=settings.LLM_PROVIDER,
        llm_configured=llm_info["configured"],
        available_providers=["openai", "anthropic", "gemini", "groq", "local"],
        model_name=settings.LLM_MODEL,
        embedding_provider=settings.EMBEDDING_PROVIDER,
        rag_ready=True
    )
