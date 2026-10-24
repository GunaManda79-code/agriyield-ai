
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import FarmerProfile

router = APIRouter(
    prefix="/api/farmer-profile",
    tags=["Farmer Profile"]
)


class FarmerProfileInput(BaseModel):
    user_id: int = Field(gt=0)
    farm_name: str | None = Field(default=None, max_length=150)
    state: str = Field(min_length=1, max_length=100)
    district: str = Field(min_length=1, max_length=100)
    village: str | None = Field(default=None, max_length=100)
    farm_size: int | None = Field(default=None, gt=0)
    farm_size_unit: str = "acres"
    soil_type: str | None = Field(default=None, max_length=100)
    preferred_crops: str | None = Field(default=None, max_length=500)
    irrigation_method: str | None = Field(default=None, max_length=100)


@router.put("/")
def save_farmer_profile(
    data: FarmerProfileInput,
    db: Session = Depends(get_db)
):
    user = db.query(__import__(
        "backend.models", fromlist=["User"]
    ).User).filter_by(id=data.user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = db.query(FarmerProfile).filter_by(
        user_id=data.user_id
    ).first()

    values = data.model_dump(exclude={"user_id"})

    if profile:
        for key, value in values.items():
            setattr(profile, key, value)
    else:
        profile = FarmerProfile(user_id=data.user_id, **values)
        db.add(profile)

    db.commit()
    db.refresh(profile)

    return {"success": True, "profile": values}


@router.get("/{user_id}")
def get_farmer_profile(
    user_id: int,
    db: Session = Depends(get_db)
):
    profile = db.query(FarmerProfile).filter_by(
        user_id=user_id
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Farmer profile not found")

    return {
        "success": True,
        "profile": {
            column.name: getattr(profile, column.name)
            for column in FarmerProfile.__table__.columns
        }
    }
