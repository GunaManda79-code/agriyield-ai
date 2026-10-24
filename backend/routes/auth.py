
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from backend.database import get_db
from backend.models import User
from backend.schemas.auth import (
    RegisterRequest,
    OTPRequest,
    OTPVerifyRequest,
)
from datetime import datetime, timedelta, timezone

from backend.models import OTPVerification
from backend.services.otp_service import generate_otp, hash_otp
from backend.services.email_service import send_email
from backend.security import create_access_token
router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)

from backend.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    OTPRequest,
    OTPVerifyRequest,
)

from pwdlib import PasswordHash

password_hasher = PasswordHash.recommended()

@router.get("/health")
def auth_health():
    return {
        "success": True,
        "message": "Authentication router is running",
    }


@router.post("/validate-register")
def validate_register(data: RegisterRequest):
    return {
        "success": True,
        "message": "Registration data is valid",
        "email": str(data.email),
        "phone_number": data.phone_number,
    }


@router.post("/register")
def register_user(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    email = str(data.email).lower().strip()
    full_name = data.full_name.strip()
    phone_number = data.phone_number.strip()

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(
            status_code=409,
            detail="This email is already registered.",
        )

    if db.query(User).filter(User.phone_number == phone_number).first():
        raise HTTPException(
            status_code=409,
            detail="This phone number is already registered.",
        )

    user = User(
        full_name=full_name,
        email=email,
        phone_number=phone_number,
        password_hash=password_hasher.hash(data.password),
        email_verified=False,
        phone_verified=False,
        is_active=True,
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Email or phone number is already registered.",
        )

    return {
        "success": True,
        "message": "Registration successful.",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone_number": user.phone_number,
        },
    }


@router.post("/request-email-otp")
async def request_email_otp(
    data: OTPRequest,
    db: Session = Depends(get_db),
):
    email = str(data.email).lower().strip()

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="No account found for this email. Please register first.",
        )

    if user.email_verified:
        raise HTTPException(
            status_code=400,
            detail="This email is already verified.",
        )

    otp = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    otp_record = OTPVerification(
        user_id=user.id,
        channel="email",
        purpose="registration",
        otp_hash=hash_otp(
            otp=otp,
            purpose="registration",
            channel="email",
            user_id=user.id,
        ),
        expires_at=expires_at,
        attempts=0,
    )

    try:
        db.add(otp_record)
        db.commit()

        await send_email(
            to_email=email,
            subject="AgriYield AI - Email Verification OTP",
            body=(
                f"Hello {user.full_name},\n\n"
                f"Your AgriYield AI verification code is: {otp}\n\n"
                "This code expires in 5 minutes. "
                "Do not share it with anyone.\n"
            ),
        )
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to send the verification email. Please try again.",
        )

    return {
        "success": True,
        "message": "Verification code sent to your email.",
    }


@router.post("/verify-email-otp")
def verify_email_otp(
    data: OTPVerifyRequest,
    db: Session = Depends(get_db),
):
    email = str(data.email).lower().strip()

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="No account found for this email. Please register first.",
        )

    if user.email_verified:
        return {
            "success": True,
            "message": "Email is already verified.",
        }

    otp_record = (
        db.query(OTPVerification)
        .filter(
            OTPVerification.user_id == user.id,
            OTPVerification.channel == "email",
            OTPVerification.purpose == "registration",
        )
        .order_by(OTPVerification.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(
            status_code=400,
            detail="No verification code found. Request a new OTP.",
        )

    if otp_record.attempts >= 5:
        raise HTTPException(
            status_code=429,
            detail="Too many attempts. Request a new OTP.",
        )

    # Compare naive and timezone-aware timestamps safely.
    expires_at = otp_record.expires_at
    if expires_at.tzinfo is None:
        expired = datetime.now(timezone.utc).replace(tzinfo=None) >= expires_at
    else:
        expired = datetime.now(timezone.utc) >= expires_at

    if expired:
        raise HTTPException(
            status_code=400,
            detail="OTP expired. Request a new one.",
        )

    from backend.services.otp_service import verify_otp_hash

    otp_record.attempts += 1

    if not verify_otp_hash(
        submitted_otp=data.otp,
        stored_hash=otp_record.otp_hash,
        purpose="registration",
        channel="email",
        user_id=user.id,
    ):
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Incorrect OTP. Please try again.",
        )

    user.email_verified = True
    db.commit()

    return {
        "success": True,
        "message": "Email verified successfully.",
    }


@router.post("/request-login-otp")
async def request_login_otp(
    data: OTPRequest,
    db: Session = Depends(get_db),
):
    email = str(data.email).lower().strip()

    user = db.query(User).filter(User.email == email).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=404,
            detail="Account not found or inactive.",
        )

    if not user.email_verified:
        raise HTTPException(
            status_code=403,
            detail="Please verify your email before logging in.",
        )

    # Invalidate previous login OTPs for this user.
    db.query(OTPVerification).filter(
        OTPVerification.user_id == user.id,
        OTPVerification.channel == "email",
        OTPVerification.purpose == "login",
    ).delete(synchronize_session=False)

    otp = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    otp_record = OTPVerification(
        user_id=user.id,
        channel="email",
        purpose="login",
        otp_hash=hash_otp(
            otp=otp,
            purpose="login",
            channel="email",
            user_id=user.id,
        ),
        expires_at=expires_at,
        attempts=0,
    )

    try:
        db.add(otp_record)
        db.commit()

        await send_email(
            to_email=email,
            subject="AgriYield AI - Login OTP",
            body=(
                f"Hello {user.full_name},\n\n"
                f"Your AgriYield AI login code is: {otp}\n\n"
                "This code expires in 5 minutes. "
                "Do not share it with anyone.\n"
            ),
        )
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to send login OTP. Please try again.",
        )

    return {
        "success": True,
        "message": "Login OTP sent to your registered email.",
    }


from backend.services.otp_service import verify_otp_hash


@router.post("/verify-login-otp")
def verify_login_otp(
    data: OTPVerifyRequest,
    db: Session = Depends(get_db),
):
    email = str(data.email).lower().strip()

    user = db.query(User).filter(User.email == email).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="Invalid account or login request.",
        )

    if not user.email_verified:
        raise HTTPException(
            status_code=403,
            detail="Please verify your email first.",
        )

    otp_record = (
        db.query(OTPVerification)
        .filter(
            OTPVerification.user_id == user.id,
            OTPVerification.channel == "email",
            OTPVerification.purpose == "login",
        )
        .order_by(OTPVerification.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(
            status_code=400,
            detail="No login OTP found. Request a new one.",
        )

    if otp_record.attempts >= 5:
        raise HTTPException(
            status_code=429,
            detail="Too many attempts. Request a new login OTP.",
        )

    expires_at = otp_record.expires_at
    now = datetime.now(timezone.utc)

    if expires_at.tzinfo is None:
        expired = now.replace(tzinfo=None) >= expires_at
    else:
        expired = now >= expires_at

    if expired:
        raise HTTPException(
            status_code=400,
            detail="Login OTP expired. Request a new one.",
        )

    otp_record.attempts += 1

    if not verify_otp_hash(
        submitted_otp=data.otp,
        stored_hash=otp_record.otp_hash,
        purpose="login",
        channel="email",
        user_id=user.id,
    ):
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Incorrect login OTP.",
        )

    # Successful OTP verification only.
    # Session creation will be implemented next.
    db.delete(otp_record)
    db.commit()

    access_token = create_access_token(user.id)

    return {
        "success": True,
        "message": "Login OTP verified successfully.",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
        },
    }



@router.get("/me")
def get_current_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.is_active == True,
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    return {
        "success": True,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "email_verified": user.email_verified,
            "phone_verified": user.phone_verified,
        },
    }

@router.post("/login")
def login_user(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    email = str(data.email).lower().strip()

    user = db.query(User).filter(User.email == email).first()

    # Use a generic error for invalid credentials.
    if not user or not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    # Existing accounts may not have a password yet.
    if not user.password_hash:
        raise HTTPException(
            status_code=403,
            detail="This account needs a password setup before login.",
        )

    if not password_hasher.verify(data.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    access_token = create_access_token(user.id)

    return {
        "success": True,
        "message": "Login successful.",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
        },
    }