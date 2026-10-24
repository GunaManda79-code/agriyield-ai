
from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    user_id: int | None = None

    crop: str = Field(..., example="Rice")
    rainfall: float = Field(..., gt=0, example=1200.0)
    temperature: float = Field(..., example=28.5)
    humidity: float = Field(..., ge=0, le=100, example=75.0)
    soil_ph: float = Field(..., ge=0, le=14, example=6.5)
    nitrogen: float = Field(..., ge=0, example=80.0)
    phosphorus: float = Field(..., ge=0, example=40.0)
    potassium: float = Field(..., ge=0, example=40.0)


class PredictionResponse(BaseModel):
    success: bool
    crop: str
    predicted_yield: float
    unit: str
