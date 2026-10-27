
import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from openai import AsyncOpenAI

BASE_DIR = Path(__file__).resolve().parent

# Support running from either the project root or chatbot_service
if (BASE_DIR / ".env").exists():
    ENV_FILE = BASE_DIR / ".env"
elif (BASE_DIR / "chatbot_service" / ".env").exists():
    ENV_FILE = BASE_DIR / "chatbot_service" / ".env"
else:
    ENV_FILE = BASE_DIR / ".env"

load_dotenv(ENV_FILE, override=True)

api_key = os.getenv("OPENAI_API_KEY", "").strip()
model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini").strip()

print("Environment file:", ENV_FILE)
print("Environment file exists:", ENV_FILE.is_file())
print("API key loaded:", bool(api_key))
print("Model:", model)

async def main():
    if not api_key:
        print("ERROR: API key not loaded.")
        print("Check that OPENAI_API_KEY=your_key is in the .env file.")
        return

    client = AsyncOpenAI(
    api_key=api_key,
    timeout=20,
    max_retries=0
)
    try:
        response = await client.responses.create(
            model=model,
            input="Reply with only the word OK."
        )
        print("SUCCESS:", response.output_text)
    except Exception as exc:
        print("ERROR TYPE:", type(exc).__name__)
        print("ERROR MESSAGE:", str(exc))
    finally:
        await client.close()

asyncio.run(main())