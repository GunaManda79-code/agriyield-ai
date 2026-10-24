
import hashlib
import hmac
import os
import secrets
import time


OTP_LENGTH = 6
OTP_TTL_SECONDS = 300
MAX_ATTEMPTS = 5


def generate_otp() -> str:
    """Generate a cryptographically secure six-digit OTP."""
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_otp(otp: str, purpose: str, channel: str, user_id: int) -> str:
    """Create a keyed HMAC digest so OTPs are not stored in plaintext."""
    secret = os.getenv("OTP_HASH_SECRET")
    if not secret:
        raise RuntimeError("OTP_HASH_SECRET is not configured.")

    message = f"{user_id}:{purpose}:{channel}:{otp}".encode("utf-8")
    return hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()


def verify_otp_hash(
    submitted_otp: str,
    stored_hash: str,
    purpose: str,
    channel: str,
    user_id: int,
) -> bool:
    """Verify an OTP without exposing timing differences from direct string comparison."""
    candidate_hash = hash_otp(submitted_otp, purpose, channel, user_id)
    return hmac.compare_digest(candidate_hash, stored_hash)


def is_otp_expired(expires_at_timestamp: float) -> bool:
    """Return True when the OTP expiry timestamp has passed."""
    return time.time() >= expires_at_timestamp
