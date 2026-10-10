import json
import logging
from typing import Dict, Any, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER.lower()
        self.openai_key = settings.OPENAI_API_KEY
        self.anthropic_key = settings.ANTHROPIC_API_KEY
        self.gemini_key = settings.GEMINI_API_KEY
        self.groq_key = settings.GROQ_API_KEY
        self.openai_base_url = settings.OPENAI_BASE_URL or "https://api.openai.com/v1"
        self.model = settings.LLM_MODEL

    def is_configured(self) -> bool:
        if self.provider == "openai":
            return bool(self.openai_key)
        elif self.provider == "anthropic":
            return bool(self.anthropic_key)
        elif self.provider == "gemini":
            return bool(self.gemini_key)
        elif self.provider == "groq":
            return bool(self.groq_key)
        elif self.provider == "local":
            return True
        return False

    def get_status_info(self) -> Dict[str, Any]:
        return {
            "configured": self.is_configured(),
            "provider": self.provider,
            "model": self.model,
            "requires_key": self.provider in ["openai", "anthropic", "gemini", "groq"] and not self.is_configured(),
        }

    async def generate_json(self, system_prompt: str, user_prompt: str) -> Optional[Dict[str, Any]]:
        # 1. Try Live LLM Provider if configured
        if self.is_configured():
            try:
                if self.provider in ["openai", "groq", "local"]:
                    api_key = self.groq_key if self.provider == "groq" else self.openai_key
                    base_url = "https://api.groq.com/openai/v1" if self.provider == "groq" else self.openai_base_url
                    headers = {"Content-Type": "application/json"}
                    if api_key:
                        headers["Authorization"] = f"Bearer {api_key}"
                    
                    payload = {
                        "model": self.model if self.provider != "groq" else "llama-3.1-70b-versatile",
                        "messages": [
                            {"role": "system", "content": system_prompt + "\nReturn ONLY valid JSON."},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.2,
                        "response_format": {"type": "json_object"}
                    }
                    async with httpx.AsyncClient(timeout=30.0) as client:
                        resp = await client.post(f"{base_url}/chat/completions", headers=headers, json=payload)
                        if resp.status_code == 200:
                            res_json = resp.json()
                            content = res_json["choices"][0]["message"]["content"]
                            return json.loads(content)
                        else:
                            logger.warning(f"LLM API returned status {resp.status_code}: {resp.text}")

                elif self.provider == "gemini" and self.gemini_key:
                    models_to_try = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-flash-latest"]
                    if self.model and "gemini" in self.model.lower() and "1.5" not in self.model and self.model not in models_to_try:
                        models_to_try.insert(0, self.model)

                    payload = {
                        "contents": [{
                            "parts": [{"text": f"{system_prompt}\nReturn ONLY JSON.\n\nUser request:\n{user_prompt}"}]
                        }],
                        "generationConfig": {"response_mime_type": "application/json"}
                    }
                    async with httpx.AsyncClient(timeout=25.0) as client:
                        for model_name in models_to_try:
                            try:
                                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.gemini_key}"
                                resp = await client.post(url, json=payload)
                                if resp.status_code == 200:
                                    data = resp.json()
                                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                                    return json.loads(text)
                                else:
                                    logger.warning(f"Gemini ({model_name}) returned status {resp.status_code}: {resp.text}")
                            except Exception as model_err:
                                logger.warning(f"Gemini ({model_name}) request error: {str(model_err)}")

                elif self.provider == "anthropic" and self.anthropic_key:
                    url = "https://api.anthropic.com/v1/messages"
                    headers = {
                        "x-api-key": self.anthropic_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    }
                    payload = {
                        "model": "claude-3-5-sonnet-20241022",
                        "system": system_prompt + "\nRespond with valid JSON only.",
                        "messages": [{"role": "user", "content": user_prompt}],
                        "max_tokens": 4096
                    }
                    async with httpx.AsyncClient(timeout=30.0) as client:
                        resp = await client.post(url, headers=headers, json=payload)
                        if resp.status_code == 200:
                            data = resp.json()
                            text = data["content"][0]["text"]
                            return json.loads(text)

            except Exception as e:
                logger.error(f"Live LLM call failed with error: {str(e)}")

        return None

    async def transcribe_audio(self, audio_bytes: bytes, mime_type: str = "audio/webm") -> Optional[str]:
        if self.provider == "gemini" and self.gemini_key:
            import base64
            b64_audio = base64.b64encode(audio_bytes).decode("utf-8")
            clean_mime = mime_type.split(";")[0].strip() if mime_type else "audio/webm"
            payload = {
                "contents": [{
                    "parts": [
                        {
                            "inline_data": {
                                "mime_type": clean_mime,
                                "data": b64_audio
                            }
                        },
                        {
                            "text": (
                                "You are an expert technical audio transcription system. "
                                "Transcribe the speaker's voice in this audio verbatim with high precision, "
                                "accurately spelling all technical terms, programming languages, and engineering concepts. "
                                "Do NOT summarize, do NOT reply to the question, and do NOT add any conversational filler or quotes. "
                                "Output strictly the verbatim words spoken. If the audio has no audible words or only background noise, return an empty string."
                            )
                        }
                    ]
                }],
                "generationConfig": {
                    "temperature": 0.0
                }
            }
            models_to_try = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-flash-latest"]
            async with httpx.AsyncClient(timeout=35.0) as client:
                for model_name in models_to_try:
                    try:
                        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.gemini_key}"
                        resp = await client.post(url, json=payload)
                        if resp.status_code == 200:
                            data = resp.json()
                            candidates = data.get("candidates", [])
                            if candidates:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                if parts:
                                    text = parts[0].get("text", "").strip()
                                    # Filter out any non-transcription refusals
                                    if text and not text.lower().startswith("please provide the audio") and not text.lower().startswith("i cannot transcribe"):
                                        return text
                        else:
                            logger.warning(f"Gemini transcribe ({model_name}) status {resp.status_code}: {resp.text[:200]}")
                    except Exception as err:
                        logger.warning(f"Audio transcription error ({model_name}): {err}")
        return None

llm_service = LLMService()
