
import os
from dotenv import load_dotenv

load_dotenv()

from backend.services.otp_service import (
    generate_otp,
    hash_otp,
    verify_otp_hash,
)

otp = generate_otp()

assert len(otp) == 6 and otp.isdigit(), "Invalid OTP format"

stored_hash = hash_otp(
    otp=otp,
    purpose="login",
    channel="email",
    user_id=1,
)

assert stored_hash != otp, "OTP should not be stored as plaintext"

assert verify_otp_hash(
    submitted_otp=otp,
    stored_hash=stored_hash,
    purpose="login",
    channel="email",
    user_id=1,
), "Correct OTP was rejected"

assert not verify_otp_hash(
    submitted_otp="000000" if otp != "000000" else "000001",
    stored_hash=stored_hash,
    purpose="login",
    channel="email",
    user_id=1,
), "Incorrect OTP was accepted"

print("OTP service tests passed!")

