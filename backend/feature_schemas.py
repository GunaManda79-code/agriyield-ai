from typing import Optional
from pydantic import BaseModel, Field

class SoilRecordCreate(BaseModel):
    farmer_name: str = Field(default="Farmer", min_length=1, max_length=100)
    location: str = Field(min_length=1, max_length=150)
    crop: str = Field(min_length=1, max_length=80)
    soil_ph: Optional[float] = Field(default=None, ge=0, le=14)
    nitrogen: Optional[float] = Field(default=None, ge=0)
    phosphorus: Optional[float] = Field(default=None, ge=0)
    potassium: Optional[float] = Field(default=None, ge=0)
    soil_moisture: Optional[float] = Field(default=None, ge=0, le=100)
    notes: Optional[str] = Field(default=None, max_length=1000)


class PredictionHistoryCreate(BaseModel):
    crop: str
    predicted_yield: float
    unit: str = "tonnes/hectare"
    input_data: dict = Field(default_factory=dict)
    user_id: int | None = None
