import httpx
import logging
import json
from app.core.config import settings

logger = logging.getLogger(__name__)


async def call_gemini(description: str, active_categories: list[str]) -> dict | None:
    if not active_categories:
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"

    prompt = (
        f"You are an IT helpdesk assistant. Based on the ticket description below, "
        f"categorize the ticket and assign a priority.\n\n"
        f"Description: {description}\n\n"
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "category": {"type": "STRING", "enum": active_categories},
                    "priority": {"type": "STRING", "enum": ["niski", "sredni", "wysoki", "krytyczny"]},
                },
                "required": ["category", "priority"],
            },
        },
    }

    try:
        async with httpx.AsyncClient(timeout=settings.GEMINI_TIMEOUT_SECONDS) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()

            text_response = data["candidates"][0]["content"]["parts"][0]["text"]
            result = json.loads(text_response)
            return result
    except Exception as e:
        logger.error(f"Gemini API call failed: {type(e).__name__} {e}")
        return None
