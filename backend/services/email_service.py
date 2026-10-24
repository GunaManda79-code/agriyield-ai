
import os
from email.message import EmailMessage

import aiosmtplib
from dotenv import load_dotenv

load_dotenv()


async def send_email(to_email: str, subject: str, body: str) -> None:
    smtp_email = os.getenv("SMTP_EMAIL")
    smtp_password = os.getenv("SMTP_APP_PASSWORD")
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))

    if not smtp_email or not smtp_password:
        raise RuntimeError(
            "SMTP_EMAIL or SMTP_APP_PASSWORD is missing from .env"
        )

    message = EmailMessage()
    message["From"] = smtp_email
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    await aiosmtplib.send(
        message,
        hostname=smtp_server,
        port=smtp_port,
        start_tls=True,
        username=smtp_email,
        password=smtp_password,
        timeout=20,
    )
