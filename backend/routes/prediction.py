from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Float, DateTime
from backend.schemas.prediction import PredictionRequest, PredictionResponse
from backend.services.prediction_service import predict_yield
from backend.database import get_db, Base, engine
import datetime

router = APIRouter(prefix="/api", tags=["Prediction"])


class PredictionModelDB(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    crop = Column(String(50), nullable=False)
    rainfall = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    soil_ph = Column(Float, nullable=False)
    predicted_yield = Column(Float, nullable=False)
    unit = Column(String(50), default="dataset yield units")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


Base.metadata.create_all(bind=engine)


@router.post("/predict", response_model=PredictionResponse)
def make_prediction(
    payload: PredictionRequest,
    db: Session = Depends(get_db)
):
    try:
        prediction_inputs = payload.dict()
        user_id = prediction_inputs.pop("user_id", None)

        result = predict_yield(prediction_inputs)

        unit = "kg/ha"

        db_record = PredictionModelDB(
            user_id=user_id,
            crop=payload.crop,
            rainfall=payload.rainfall,
            temperature=payload.temperature,
            humidity=payload.humidity,
            soil_ph=payload.soil_ph,
            predicted_yield=result,
            unit=unit
        )

        db.add(db_record)
        db.commit()

        return {
            "success": True,
            "crop": payload.crop,
            "predicted_yield": round(result, 2),
            "unit": unit
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    return (
        db.query(PredictionModelDB)
        .order_by(PredictionModelDB.created_at.desc())
        .limit(50)
        .all()
    )