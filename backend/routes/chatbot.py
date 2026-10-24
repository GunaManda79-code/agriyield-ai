import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from openai import OpenAI
from openai import APIConnectionError, APIStatusError, RateLimitError
from pydantic import BaseModel, Field

# Load .env from the crop yield project root
PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")

router = APIRouter(
    prefix="/api/chatbot",
    tags=["Farming Chatbot"]
)


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    language: str = "en"


class ChatResponse(BaseModel):
    answer: str
    source: str


@router.post("/ask", response_model=ChatResponse)
async def ask_chatbot(request: ChatRequest):
    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Please enter a farming question."
        )

    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="API key is missing. Check the project root .env file."
        )

    language_names = {
        "en": "English",
        "te": "Telugu",
        "hi": "Hindi"
    }
    language = language_names.get(
        request.language.lower(),
        "English"
    )

    instructions = """
You are AgriYield AI, a helpful agricultural assistant for farmers.

- Respond in the requested language.
- Use simple, practical language.
- Help with crops, soil, irrigation, rainfall, farming practices,
  crop diseases, and agricultural planning.
- Never invent live weather, market prices, or the user's prediction
  results. Explain when live data is not connected.
- Do not claim that you have inspected a crop image or farm data
  unless that information was actually provided.
- For serious crop disease or pesticide questions, advise consulting
  a qualified local agricultural expert and following product labels.
- Clearly distinguish general advice from verified information.
"""

    try:
        client = OpenAI(api_key=api_key)

        response = client.responses.create(
            model="gpt-4.1-mini",
            instructions=instructions,
            input=f"Reply in {language}.\nFarmer's question: {question}",
            max_output_tokens=500
        )

        answer = response.output_text.strip()

        if not answer:
            raise HTTPException(
                status_code=502,
                detail="The AI returned an empty response. Please try again."
            )

        return ChatResponse(
            answer=answer,
            source="openai"
        )

    except HTTPException:
        raise

    except RateLimitError:
        raise HTTPException(
            status_code=429,
            detail="AI usage limit reached. Check your API quota and billing."
        )

    except APIConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Could not connect to the AI service. Please try again."
        )

    except APIStatusError:
        raise HTTPException(
            status_code=502,
            detail="The AI service returned an error. Check your API model access and configuration."
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An unexpected chatbot error occurred."
        )