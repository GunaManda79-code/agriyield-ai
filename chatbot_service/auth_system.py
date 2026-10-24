
import os
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
    select,
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Session,
    mapped_column,
    relationship,
    sessionmaker,
)

BASE_DIR = Path(__file__).resolve().parent
DATABASE_URL = f"sqlite:///{BASE_DIR / 'agriyield_auth.db'}"

SECRET_KEY = os.getenv("AUTH_SECRET_KEY", "").strip()
if len(SECRET_KEY) < 32:
    raise RuntimeError(
        "Set AUTH_SECRET_KEY to a random secret of at least 32 characters."
    )

ALGORITHM = "HS256"
TOKEN_MINUTES = 60 * 24

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = mapped_column(Integer, primary_key=True)
    username = mapped_column(String(40), unique=True, index=True)
    email = mapped_column(String(254), unique=True, index=True)
    password_hash = mapped_column(String(255))
    is_active = mapped_column(Boolean, default=True)
    created_at = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    chats = relationship(
        "Chat",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Chat(Base):
    __tablename__ = "chats"

    id = mapped_column(Integer, primary_key=True)
    user_id = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    title = mapped_column(String(100), default="New chat")
    created_at = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="chats")
    messages = relationship(
        "ChatMessage",
        back_populates="chat",
        cascade="all, delete-orphan",
        order_by="ChatMessage.id",
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = mapped_column(Integer, primary_key=True)
    chat_id = mapped_column(
        ForeignKey("chats.id", ondelete="CASCADE"),
        index=True,
    )
    role = mapped_column(String(20))
    content = mapped_column(Text)
    created_at = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    chat = relationship("Chat", back_populates="messages")


Base.metadata.create_all(bind=engine)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=40)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


def user_response(user: User):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
    }


def create_token(user: User):
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "iat": now,
        "exp": now + timedelta(minutes=TOKEN_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    error = HTTPException(
        status_code=401,
        detail="Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        user_id = int(payload.get("sub", ""))
    except (JWTError, ValueError, TypeError):
        raise error

    user = db.get(User, user_id)

    if not user or not user.is_active:
        raise error

    return user


@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    username = data.username.strip()
    email = str(data.email).strip().lower()

    if not re.fullmatch(r"[A-Za-z0-9_.-]{3,40}", username):
        raise HTTPException(
            status_code=422,
            detail="Username must contain 3–40 letters, numbers, dots, underscores or hyphens.",
        )

    existing = db.scalar(
        select(User).where(
            (User.username == username) | (User.email == email)
        )
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="That username or email is already registered.",
        )

    user = User(
        username=username,
        email=email,
        password_hash=pwd_context.hash(data.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "access_token": create_token(user),
        "token_type": "bearer",
        "user": user_response(user),
    }


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    email = str(data.email).strip().lower()

    user = db.scalar(select(User).where(User.email == email))

    if (
        not user
        or not pwd_context.verify(data.password, user.password_hash)
        or not user.is_active
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    return {
        "access_token": create_token(user),
        "token_type": "bearer",
        "user": user_response(user),
    }


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return user_response(user)


@router.get("/chats")
def list_chats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chats = db.scalars(
        select(Chat)
        .where(Chat.user_id == user.id)
        .order_by(Chat.updated_at.desc())
    ).all()

    return [
        {
            "id": chat.id,
            "title": chat.title,
            "updated_at": chat.updated_at.isoformat(),
        }
        for chat in chats
    ]


@router.get("/chats/{chat_id}")
def get_chat(
    chat_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat = db.scalar(
        select(Chat).where(
            Chat.id == chat_id,
            Chat.user_id == user.id,
        )
    )

    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")

    return {
        "id": chat.id,
        "title": chat.title,
        "messages": [
            {"role": item.role, "content": item.content}
            for item in chat.messages
        ],
    }


@router.delete("/chats/{chat_id}")
def delete_chat(
    chat_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat = db.scalar(
        select(Chat).where(
            Chat.id == chat_id,
            Chat.user_id == user.id,
        )
    )

    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")

    db.delete(chat)
    db.commit()

    return {"message": "Chat deleted."}

