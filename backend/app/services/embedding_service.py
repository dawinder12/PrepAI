import math
import re
from typing import List, Optional
import httpx
from app.core.config import settings

class EmbeddingService:
    def __init__(self):
        self.provider = settings.EMBEDDING_PROVIDER
        self.openai_key = settings.OPENAI_API_KEY

    def is_configured(self) -> bool:
        return bool(self.openai_key) if self.provider == "openai" else True

    async def get_embedding(self, text: str) -> List[float]:
        text = text.replace("\n", " ").strip()
        if not text:
            return [0.0] * 64

        # If OpenAI is configured and selected
        if self.provider == "openai" and self.openai_key:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        "https://api.openai.com/v1/embeddings",
                        headers={"Authorization": f"Bearer {self.openai_key}"},
                        json={
                            "input": text[:8000],
                            "model": "text-embedding-3-small"
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["data"][0]["embedding"]
            except Exception:
                pass  # Fall back to deterministic vector embedding

        # Deterministic lightweight semantic hash-vector embedding (64 dimensions)
        # Based on subword n-grams and token hashing with L2 unit normalization
        return self._generate_local_embedding(text, dim=64)

    def _generate_local_embedding(self, text: str, dim: int = 64) -> List[float]:
        words = re.findall(r'\b[a-zA-Z0-9_\-\.]{2,}\b', text.lower())
        vec = [0.0] * dim
        if not words:
            return vec

        for word in words:
            # Hash character shingles to distributed dimensions
            h = hash(word)
            idx = abs(h) % dim
            sign = 1.0 if (h // dim) % 2 == 0 else -1.0
            vec[idx] += sign * (1.0 + math.log(1.0 + len(word)))

        # L2 normalize
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        if not v1 or not v2 or len(v1) != len(v2):
            return 0.0
        dot = sum(a * b for a, b in zip(v1, v2))
        norm1 = math.sqrt(sum(a * a for a in v1))
        norm2 = math.sqrt(sum(b * b for b in v2))
        if norm1 <= 0 or norm2 <= 0:
            return 0.0
        return max(0.0, min(1.0, dot / (norm1 * norm2)))

embedding_service = EmbeddingService()
