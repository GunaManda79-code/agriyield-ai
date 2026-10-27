
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Session

# Load the main website environment before importing its authentication.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
CHATBOT_DIR = Path(__file__).resolve().parent

load_dotenv(PROJECT_ROOT / ".env", override=False)
load_dotenv(CHATBOT_DIR / ".env", override=False)

from backend.database import Base, engine, get_db
from backend.models import User
from backend.security import get_current_user


# --------------------------------------------------
# Configuration
# --------------------------------------------------

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY", "").strip()
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma4:31b").strip()

ollama_client = (
    AsyncOpenAI(
        api_key=OLLAMA_API_KEY,
        base_url="https://ollama.com/v1",
        timeout=45,
        max_retries=1,
    )
    if OLLAMA_API_KEY
    else None
)


# --------------------------------------------------
# Chat history tables
# These use the SAME database as the main website.
# --------------------------------------------------

class Chat(Base):
    __tablename__ = "chatbot_chats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(150), nullable=False, default="New conversation")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        index=True,
    )


class ChatMessage(Base):
    __tablename__ = "chatbot_chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(
        Integer,
        ForeignKey("chatbot_chats.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# Create only missing tables; existing website tables are retained.
Base.metadata.create_all(bind=engine)


# --------------------------------------------------
# FastAPI app and CORS
# --------------------------------------------------

app = FastAPI(title="AgriYield AI Chatbot")

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
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


# --------------------------------------------------
# Request models
# --------------------------------------------------

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)
    language: str = "English"
    chat_id: Optional[int] = None


class WeatherRequest(BaseModel):
    location: str = Field(..., min_length=1, max_length=150)
    language: str = "English"


# --------------------------------------------------
# Helpers
# --------------------------------------------------

def get_owned_chat(db: Session, chat_id: int, user_id: int) -> Chat:
    chat = (
        db.query(Chat)
        .filter(Chat.id == chat_id, Chat.user_id == user_id)
        .first()
    )
    if not chat:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return chat


def format_datetime(value):
    return value.isoformat() if value else None


def get_system_prompt(language: str) -> str:
    return f"""
You are AgriYield AI, a helpful agricultural assistant for farmers.

Respond in {language}, using simple and practical language.
Help with crop selection, soil, rainfall, weather, irrigation,
fertilizers, pests, and general farming practices.
Give safe, realistic advice. Do not invent live weather information,
guaranteed crop yields, or exact market prices.
For chemical treatments, advise users to follow local agricultural
expert guidance and product labels.
Explain that crop-yield predictions are estimates, not guarantees.
"""


# --------------------------------------------------
# Health
# --------------------------------------------------

@app.get("/")
def root():
    return {"message": "AgriYield AI Chatbot is running"}


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "AgriYield AI Chatbot",
        "ai_configured": ollama_client is not None,
    }


# --------------------------------------------------
# Chat history API
# All routes require the MAIN website login token.
# --------------------------------------------------

@app.get("/api/chats")
def list_chats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chats = (
        db.query(Chat)
        .filter(Chat.user_id == current_user.id)
        .order_by(Chat.updated_at.desc(), Chat.id.desc())
        .all()
    )

    return {
        "chats": [
            {
                "id": chat.id,
                "title": chat.title,
                "created_at": format_datetime(chat.created_at),
                "updated_at": format_datetime(chat.updated_at),
            }
            for chat in chats
        ]
    }


@app.get("/api/chats/{chat_id}")
def get_chat_history(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat = get_owned_chat(db, chat_id, current_user.id)

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.chat_id == chat.id)
        .order_by(ChatMessage.id.asc())
        .all()
    )

    return {
        "id": chat.id,
        "title": chat.title,
        "messages": [
            {
                "id": message.id,
                "role": message.role,
                "content": message.content,
                "created_at": format_datetime(message.created_at),
            }
            for message in messages
        ],
    }


@app.delete("/api/chats/{chat_id}")
def delete_chat(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat = get_owned_chat(db, chat_id, current_user.id)

    db.query(ChatMessage).filter(
        ChatMessage.chat_id == chat.id
    ).delete(synchronize_session=False)

    db.delete(chat)
    db.commit()

    return {"success": True, "chat_id": chat_id}


# --------------------------------------------------
# AI chat API
# A new database conversation is created when chat_id
# is absent. Existing chats are checked for ownership.
# --------------------------------------------------

@app.post("/api/chat")
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    message_text = request.message.strip()

    if not message_text:
        raise HTTPException(status_code=400, detail="Please enter a message.")

    if not ollama_client:
        raise HTTPException(
            status_code=503,
            detail="AI service is not configured. Check OLLAMA_API_KEY.",
        )

    new_chat = request.chat_id is None

    if new_chat:
        chat_record = Chat(
            user_id=current_user.id,
            title=message_text[:47] + ("…" if len(message_text) > 47 else ""),
        )
        db.add(chat_record)
        db.flush()
    else:
        chat_record = get_owned_chat(db, request.chat_id, current_user.id)

    try:
        response = await ollama_client.chat.completions.create(
            model=OLLAMA_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": get_system_prompt(request.language),
                },
                {
                    "role": "user",
                    "content": message_text,
                },
            ],
            temperature=0.4,
        )

        answer = (response.choices[0].message.content or "").strip()

        if not answer:
            raise RuntimeError("The AI returned an empty response.")

        db.add_all(
            [
                ChatMessage(
                    chat_id=chat_record.id,
                    role="user",
                    content=message_text,
                ),
                ChatMessage(
                    chat_id=chat_record.id,
                    role="assistant",
                    content=answer,
                ),
            ]
        )

        chat_record.updated_at = datetime.now(timezone.utc)
        db.commit()

        return {
            "reply": answer,
            "chat_id": chat_record.id,
            "language": request.language,
            "mode": "ollama-cloud",
        }

    except Exception as exc:
        db.rollback()
        logger.exception("Chat request failed")

        if isinstance(exc, HTTPException):
            raise

        raise HTTPException(
            status_code=502,
            detail="The AI could not respond right now. Please try again.",
        ) from exc


# --------------------------------------------------
# Real-time weather API
# --------------------------------------------------

@app.post("/api/weather")
async def get_weather(request: WeatherRequest):
    location = request.location.strip()

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            geo_response = await client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={"name": location, "count": 1, "language": "en"},
            )
            geo_response.raise_for_status()
            geo_data = geo_response.json()

            results = geo_data.get("results") or []
            if not results:
                raise HTTPException(
                    status_code=404,
                    detail="Location not found. Try a nearby town or city.",
                )

            place = results[0]

            weather_response = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": place["latitude"],
                    "longitude": place["longitude"],
                    "current": (
                        "temperature_2m,relative_humidity_2m,"
                        "apparent_temperature,is_day,precipitation,"
                        "weather_code,wind_speed_10m"
                    ),
                    "daily": "precipitation_probability_max",
                    "forecast_days": 1,
                    "timezone": "auto",
                },
            )
            weather_response.raise_for_status()
            weather_data = weather_response.json()

        current = weather_data.get("current", {})
        daily = weather_data.get("daily", {})

        return {
            "location": ", ".join(
                part for part in [place.get("name"), place.get("admin1"), place.get("country")]
                if part
            ),
            "temperature_c": current.get("temperature_2m"),
            "feels_like_c": current.get("apparent_temperature"),
            "humidity_percent": current.get("relative_humidity_2m"),
            "precipitation_mm": current.get("precipitation"),
            "wind_speed_kmh": current.get("wind_speed_10m"),
            "weather_code": current.get("weather_code"),
            "rain_probability_percent": (
                daily.get("precipitation_probability_max", [None])[0]
            ),
            "time": current.get("time"),
            "language": request.language,
            "source": "Open-Meteo",
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Weather request failed")
        raise HTTPException(
            status_code=502,
            detail="Weather information is temporarily unavailable.",
        ) from exc
