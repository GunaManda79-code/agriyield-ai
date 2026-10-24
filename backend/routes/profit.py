
from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text

from backend.database import engine

router = APIRouter(prefix="/api/profit", tags=["Farm Profit"])


class ProfitRecordCreate(BaseModel):
    crop: str = Field(min_length=1, max_length=100)
    land_area: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    area_unit: str = Field(default="acres", max_length=20)
    expected_yield: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    expected_price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    total_cost: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    estimated_revenue: Decimal = Field(ge=0, max_digits=14, decimal_places=2)
    estimated_profit: Decimal
    created_at: datetime | None = None


@router.post("/records")
def save_profit_record(record: ProfitRecordCreate):
    try:
        with engine.begin() as connection:
            result = connection.execute(
                text("""
                    INSERT INTO farm_profit_records
                    (crop, land_area, area_unit, expected_yield,
                     expected_price, total_cost, estimated_revenue,
                     estimated_profit)
                    VALUES
                    (:crop, :land_area, :area_unit, :expected_yield,
                     :expected_price, :total_cost, :estimated_revenue,
                     :estimated_profit)
                """),
                {
                    "crop": record.crop.strip(),
                    "land_area": record.land_area,
                    "area_unit": record.area_unit,
                    "expected_yield": record.expected_yield,
                    "expected_price": record.expected_price,
                    "total_cost": record.total_cost,
                    "estimated_revenue": record.estimated_revenue,
                    "estimated_profit": record.estimated_profit,
                },
            )
            record_id = result.lastrowid

        return {
            "success": True,
            "message": "Farm profit record saved",
            "id": record_id,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save farm profit record: {type(exc).__name__}",
        )

        
@router.get("/records")
def list_profit_records(limit: int = 50):
    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 100",
        )

    try:
        with engine.connect() as connection:
            rows = connection.execute(
                text("""
                    SELECT id, crop, land_area, area_unit,
                           expected_yield, expected_price,
                           total_cost, estimated_revenue,
                           estimated_profit, created_at
                    FROM farm_profit_records
                    ORDER BY id DESC
                    LIMIT :limit
                """),
                {"limit": limit},
            ).mappings().all()

        return {
            "success": True,
            "count": len(rows),
            "records": [
                {
                    **dict(row),
                    "land_area": float(row["land_area"]),
                    "expected_yield": float(row["expected_yield"]),
                    "expected_price": float(row["expected_price"]),
                    "total_cost": float(row["total_cost"]),
                    "estimated_revenue": float(row["estimated_revenue"]),
                    "estimated_profit": float(row["estimated_profit"]),
                }
                for row in rows
            ],
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not retrieve farm profit records: {type(exc).__name__}",
        )

