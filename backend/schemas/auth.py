
from pydantic import BaseModel, EmailStr, Field
from typing import Literal


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone_number: str = Field(
        min_length=10,
        max_length=20,
        pattern=r"^\+?[0-9]{10,19}$"
    )
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class OTPRequest(BaseModel):
    email: EmailStr
    channel: Literal["email", "sms"]


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    channel: Literal["email", "sms"]
    otp: str = Field(pattern=r"^[0-9]{6}$")
