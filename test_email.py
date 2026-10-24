
import asyncio
import os

from dotenv import load_dotenv
from backend.services.email_service import send_email

load_dotenv()


async def main():
    recipient = input("Enter your own email address: ").strip()

    try:
        await send_email(
            to_email=recipient,
            subject="AgriYield AI - Email Test",
            body=(
                "Hello!\n\n"
                "Your AgriYield AI email service is working.\n"
                "This is a test email, not an OTP.\n"
            ),
        )
        print("SUCCESS: Test email sent.")
    except Exception as exc:
        print("EMAIL FAILED:", type(exc).__name__, str(exc))


if __name__ == "__main__":
    asyncio.run(main())
