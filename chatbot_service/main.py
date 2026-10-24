
import logging
import os
import asyncio
import json

from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from typing import Literal
from auth_system import router as auth_router


# ============================================
# CONFIGURATION
# ============================================

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"

# Load environment variables from chatbot_service/.env
load_dotenv(dotenv_path=ENV_FILE, override=False)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

logger = logging.getLogger("agriyield.chatbot")

# Ollama Cloud configuration
API_KEY = os.getenv("OLLAMA_API_KEY", "").strip()
MODEL = os.getenv("OLLAMA_MODEL", "gemma4:31b").strip()

if not API_KEY:
    raise RuntimeError(
        f"OLLAMA_API_KEY is missing. Check this file: {ENV_FILE}"
    )

client = AsyncOpenAI(
    api_key=API_KEY,
    base_url="https://ollama.com/v1",
    timeout=45.0,
    max_retries=1,
)


# ============================================
# FASTAPI APPLICATION
# ============================================

app = FastAPI(
    title="AgriYield AI Farming Copilot",
    version="2.1.0",
    description="Multilingual agricultural assistant API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:8001",
        "http://localhost:8001",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

app.include_router(auth_router)
# ============================================
# REQUEST MODELS
# ============================================

Language = Literal["en", "te", "hi"]


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    language: Language = "en"


class WeatherRequest(BaseModel):
    location: str = Field(min_length=1, max_length=100)
    language: Language = "en"


# ============================================
# LANGUAGE SETTINGS
# ============================================

LANGUAGE_NAMES = {
    "en": "English",
    "te": "Telugu",
    "hi": "Hindi",
}


# ============================================
# OPEN-METEO WEATHER HELPERS
# ============================================

def get_json(url: str, params: dict) -> dict:
    """Fetch JSON from a public weather API."""
    query = urlencode(params)
    request_url = f"{url}?{query}"

    with urlopen(request_url, timeout=12) as response:
        return json.loads(response.read().decode("utf-8"))


async def fetch_json(url: str, params: dict) -> dict:
    """Run the blocking HTTP request outside the event loop."""
    return await asyncio.to_thread(get_json, url, params)


# ============================================
# HEALTH CHECK
# ============================================

@app.get("/")
async def root():
    return {
        "service": "AgriYield AI Farming Copilot",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "AgriYield AI Chatbot",
        "provider": "ollama-cloud",
        "languages": ["en", "te", "hi"],
        "model": MODEL,
    }


# ============================================
# CHAT ENDPOINT - OLLAMA CLOUD
# ============================================

@app.post("/api/chat")
async def chat(request: ChatRequest):
    message = request.message.strip()

    if not message:
        raise HTTPException(
            status_code=422,
            detail="Message cannot be empty.",
        )

    language_name = LANGUAGE_NAMES[request.language]

    system_prompt = f"""
You are AgriYield AI, a helpful agricultural assistant
for Indian farmers.

LANGUAGE:
Always answer in {language_name}.
Understand regional language expressions, spelling
variations, and mixed-language questions.

YOUR EXPERTISE:
- Crop selection and crop management
- Crop yield improvement
- Soil health and soil testing
- Irrigation and water management
- Rainfall and weather information
- Pest and plant disease management
- Fertilizer safety and responsible use
- Government agricultural schemes
- Farming practices and harvest planning

RESPONSE STYLE:
- Be friendly, practical, and easy to understand.
- Use short paragraphs and numbered steps when useful.
- Ask follow-up questions when important information
  such as crop, location, or growth stage is missing.
- Adapt suggestions to Indian farming conditions.
- Avoid unnecessary technical jargon.

SAFETY AND ACCURACY:
- Do not invent live weather, market prices, or scheme dates.
- Do not claim to have checked live information unless
  it was actually retrieved.
- Recommend soil testing before specific fertilizer decisions.
- For pesticide advice, recommend following the product label
  and consulting a qualified local agricultural expert.
- Do not claim a plant disease is certain without sufficient
  evidence.
- Clearly state uncertainty where appropriate.
"""

    try:
        logger.info(
            "Chat request received: language=%s, message_length=%s",
            request.language,
            len(message),
        )

        response = await client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": message,
                },
            ],
        )

        answer = (
            response.choices[0].message.content or ""
        ).strip()

        if not answer:
            logger.error("Ollama Cloud returned an empty response.")

            raise HTTPException(
                status_code=502,
                detail=(
                    "The AI returned an empty response. "
                    "Please try again."
                ),
            )

        logger.info("Ollama Cloud response generated successfully.")

        return {
            "reply": answer,
            "language": request.language,
            "mode": "ollama-cloud",
        }

    except HTTPException:
        raise

    except Exception as exc:
        # Details stay in the backend terminal.
        # Never return credentials or internal exception details.
        logger.exception(
            "Ollama Cloud request failed. Exception type: %s",
            type(exc).__name__,
        )

        raise HTTPException(
            status_code=502,
            detail=(
                "The AI service could not complete your request. "
                "Check the chatbot backend terminal for details."
            ),
        ) from exc


# ============================================
# WEATHER ENDPOINT - OPEN-METEO
# ============================================

@app.post("/api/weather")
async def weather(request: WeatherRequest):
    location = request.location.strip()

    if not location:
        raise HTTPException(
            status_code=422,
            detail="Please provide a village or city name.",
        )

    try:
        # Find the location using Open-Meteo geocoding.
        geo_data = await fetch_json(
            "https://geocoding-api.open-meteo.com/v1/search",
            {
                "name": location,
                "count": 1,
                "language": request.language,
                "format": "json",
            },
        )

        results = geo_data.get("results") or []

        if not results:
            raise HTTPException(
                status_code=404,
                detail="Location not found. Try a nearby town or city.",
            )

        place = results[0]

        # Retrieve current conditions and a three-day forecast.
        forecast = await fetch_json(
            "https://api.open-meteo.com/v1/forecast",
            {
                "latitude": place["latitude"],
                "longitude": place["longitude"],
                "current": (
                    "temperature_2m,"
                    "relative_humidity_2m,"
                    "precipitation,"
                    "rain,"
                    "wind_speed_10m"
                ),
                "daily": (
                    "temperature_2m_max,"
                    "temperature_2m_min,"
                    "precipitation_probability_max"
                ),
                "forecast_days": 3,
                "timezone": "auto",
            },
        )

        current = forecast.get("current", {})

        return {
            "location": ", ".join(
                item
                for item in [
                    place.get("name"),
                    place.get("admin1"),
                    place.get("country"),
                ]
                if item
            ),
            "current": current,
            "daily": forecast.get("daily", {}),
            "units": {
                "temperature": forecast.get(
                    "current_units", {}
                ).get("temperature_2m", "°C"),
                "wind": forecast.get(
                    "current_units", {}
                ).get("wind_speed_10m", "km/h"),
                "precipitation": forecast.get(
                    "current_units", {}
                ).get("precipitation", "mm"),
            },
        }

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "Weather request failed. Exception type: %s",
            type(exc).__name__,
        )

        raise HTTPException(
            status_code=502,
            detail=(
                "Weather information is temporarily unavailable. "
                "Please try again."
            ),
        ) from exc
