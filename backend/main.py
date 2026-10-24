
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from backend.routes import prediction
from backend.routes import features
from backend.routes import chatbot
from backend.routes import profit
from backend.routes import sowing
from backend.routes import auth
from backend import models
from backend.database import Base, engine
from backend.routes import schemes
from backend.routes import farmer_profile


# --------------------------------------------------
# FastAPI application
# --------------------------------------------------

app = FastAPI(
    title="AgriYield AI - Crop Yield Prediction API",
    version="1.1.0"
)

# Create database tables for registered models
Base.metadata.create_all(bind=engine)

# --------------------------------------------------
# CORS configuration
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# --------------------------------------------------
# Register API routers
# --------------------------------------------------

app.include_router(prediction.router)
app.include_router(features.router)
app.include_router(chatbot.router)
app.include_router(profit.router)
app.include_router(sowing.router)
app.include_router(auth.router)
app.include_router(schemes.router)
app.include_router(farmer_profile.router)


# --------------------------------------------------
# Frontend directory
# --------------------------------------------------

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


# --------------------------------------------------
# Root route: open login page
# --------------------------------------------------

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/language-select.html")


# --------------------------------------------------
# Health check
# --------------------------------------------------

@app.get("/health")
def health_check():
    return {"status": "healthy"}


# --------------------------------------------------
# Serve frontend files
# Keep this AFTER the API routes and root route.
# --------------------------------------------------

app.mount(
    "/",
    StaticFiles(directory=str(FRONTEND_DIR), html=True),
    name="frontend"
)
