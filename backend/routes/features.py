from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import requests
from datetime import date
from backend.db_features import get_db, init_feature_tables, save_prediction_history
from backend.feature_schemas import SoilRecordCreate, PredictionHistoryCreate
router = APIRouter(prefix="/api/features", tags=["Farmer Features"])
WEATHER_TIMEOUT = 12

@router.on_event("startup")
def startup_features():
    init_feature_tables()

@router.get("/health")
def features_health():
    return {"success": True, "module": "farmer-features", "database": "initialized"}

@router.get("/weather")
def weather(city: str = Query(..., min_length=2, max_length=100)):
    """Current weather and a five-day forecast for a named city using Open-Meteo."""
    try:
        geo = requests.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": city, "count": 1, "language": "en", "format": "json"},
            timeout=WEATHER_TIMEOUT
        )
        geo.raise_for_status()
        places = geo.json().get("results", [])
        if not places:
            raise HTTPException(status_code=404, detail=f"Could not find location: {city}")
        place = places[0]
        lat, lon = place["latitude"], place["longitude"]
        forecast_response = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": lat, "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
                "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum",
                "timezone": "auto", "forecast_days": 5
            },
            timeout=WEATHER_TIMEOUT
        )
        forecast_response.raise_for_status()
        data = forecast_response.json()
        return {
            "success": True,
            "location": {
                "name": place.get("name"),
                "admin1": place.get("admin1"),
                "country": place.get("country"),
                "latitude": lat, "longitude": lon
            },
            "current": data.get("current", {}),
            "daily": data.get("daily", {}),
            "units": {"temperature": "°C", "wind_speed": "km/h", "precipitation": "mm"},
            "source": "Open-Meteo",
            "note": "Forecasts can change. Use local observations for farm decisions."
        }
    except HTTPException:
        raise
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Weather provider unavailable: {exc.__class__.__name__}")

@router.get("/soil-records")
def list_soil_records(limit: int = Query(100, ge=1, le=500)):
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM soil_records ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
        return {"success": True, "records": [dict(row) for row in rows]}

@router.post("/soil-records")
def create_soil_record(record: SoilRecordCreate):
    with get_db() as conn:
        cur = conn.execute("""
            INSERT INTO soil_records
            (farmer_name, location, crop, soil_ph, nitrogen, phosphorus, potassium, soil_moisture, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            record.farmer_name, record.location, record.crop, record.soil_ph,
            record.nitrogen, record.phosphorus, record.potassium,
            record.soil_moisture, record.notes
        ))
        conn.commit()
        row = conn.execute("SELECT * FROM soil_records WHERE id = ?", (cur.lastrowid,)).fetchone()
        return {"success": True, "record": dict(row)}

@router.delete("/soil-records/{record_id}")
def delete_soil_record(record_id: int):
    with get_db() as conn:
        cur = conn.execute("DELETE FROM soil_records WHERE id = ?", (record_id,))
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Soil record not found")
        return {"success": True, "deleted_id": record_id}



@router.get("/history")
def feature_prediction_history(
    user_id: int = Query(..., ge=1),
    limit: int = Query(100, ge=1, le=500),
):
    from sqlalchemy import text
    from backend.database import engine

    with engine.connect() as connection:
        rows = connection.execute(
            text("""
                SELECT id, crop, predicted_yield, unit, input_json, created_at
                FROM prediction_history
                WHERE user_id = :user_id
                ORDER BY id DESC
                LIMIT :limit
            """),
            {"user_id": user_id, "limit": limit},
        ).mappings().all()

    return {
        "success": True,
        "history": [dict(row) for row in rows],
    }

    from sqlalchemy import text
    from backend.database import engine

    with engine.connect() as connection:
        rows = connection.execute(
            text("""
                SELECT id, crop, predicted_yield, unit, input_json, created_at
                FROM prediction_history
                ORDER BY id DESC
                LIMIT :limit
            """),
            {"limit": limit},
        ).mappings().all()

        return {
            "success": True,
            "history": [dict(row) for row in rows],
        }


@router.post("/history")
def add_prediction_history(item: PredictionHistoryCreate):
    save_prediction_history(
        item.crop,
        item.predicted_yield,
        item.unit,
        item.input_data,
        item.user_id,
    )
    return {
        "success": True,
        "message": "History record saved",
    }



@router.get("/market-prices")
def market_prices(crop: Optional[str] = None):
    from sqlalchemy import text
    from backend.database import engine

    try:
        query = """
            SELECT id, crop, market, price_per_quintal,
                   currency, price_date, source_note, created_at
            FROM market_price_records
        """
        params = {}

        if crop and crop.strip():
            query += " WHERE crop LIKE :crop"
            params["crop"] = f"%{crop.strip()}%"

        query += " ORDER BY price_date DESC, crop ASC"

        with engine.connect() as connection:
            rows = connection.execute(
                text(query), params
            ).mappings().all()

        return {
            "success": True,
            "prices": [dict(row) for row in rows],
            "warning": (
                "Demo data only — these are not live market prices. "
                "Verify current prices with an official market source."
            )
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not retrieve market prices: {type(exc).__name__}"
        )


@router.post("/irrigation-advice")
def irrigation_advice(
    rainfall_mm: float = Query(..., ge=0, le=1000),
    soil_moisture_percent: Optional[float] = Query(default=None, ge=0, le=100),
    forecast_rain_probability: Optional[float] = Query(default=None, ge=0, le=100)
):
    if soil_moisture_percent is not None and soil_moisture_percent >= 60:
        message = "Soil moisture input is high. Check the crop and soil before irrigating."
        level = "caution"
    elif rainfall_mm >= 20 or (forecast_rain_probability is not None and forecast_rain_probability >= 70):
        message = "Rainfall is recent or rain is likely. Re-check soil moisture before scheduling irrigation."
        level = "consider_waiting"
    elif soil_moisture_percent is not None and soil_moisture_percent < 25:
        message = "Entered soil moisture is low. Check the crop's stage and local soil conditions; irrigation may be needed."
        level = "check_irrigation"
    else:
        message = "Not enough information for a reliable recommendation. Check soil moisture and crop stage before deciding."
        level = "check_locally"
    return {
        "success": True, "guidance_level": level, "message": message,
        "inputs": {"recent_rainfall_mm": rainfall_mm, "soil_moisture_percent": soil_moisture_percent,
                   "forecast_rain_probability_percent": forecast_rain_probability},
        "note": "General decision support only; not a substitute for local agronomy advice."
    }

@router.get("/weather/history")
def historical_weather(
    city: str = Query(..., min_length=2, max_length=100),
    days: int = Query(5, ge=1, le=5)
):
    """Fetch previous days' weather and save daily records in MySQL."""
    import requests
    from sqlalchemy import text
    from backend.database import engine
    from datetime import date, timedelta

    try:
        # Find the city coordinates
        geo_response = requests.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={
                "name": city,
                "count": 1,
                "language": "en",
                "format": "json"
            },
            timeout=WEATHER_TIMEOUT
        )
        geo_response.raise_for_status()

        places = geo_response.json().get("results", [])
        if not places:
            raise HTTPException(
                status_code=404,
                detail=f"Could not find location: {city}"
            )

        place = places[0]
        lat, lon = place["latitude"], place["longitude"]
        location_name = place.get("name", city)

        # Previous calendar days, excluding today
        end_date = date.today() - timedelta(days=1)
        start_date = end_date - timedelta(days=days - 1)

        history_response = requests.get(
            "https://archive-api.open-meteo.com/v1/archive",
            params={
                "latitude": lat,
                "longitude": lon,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "daily": (
                    "temperature_2m_mean,"
                    "relative_humidity_2m_mean,"
                    "precipitation_sum"
                ),
                "timezone": "auto"
            },
            timeout=WEATHER_TIMEOUT
        )
        history_response.raise_for_status()

        daily = history_response.json().get("daily", {})
        dates = daily.get("time", [])

        saved_count = 0

        with engine.begin() as connection:
            for i, weather_date in enumerate(dates):
                temperature = daily.get("temperature_2m_mean", [])[i]
                humidity = daily.get(
                    "relative_humidity_2m_mean", []
                )[i]
                rainfall = daily.get("precipitation_sum", [])[i]

                connection.execute(
                    text("""
                        INSERT INTO weather_history
                            (location, temperature, humidity, rainfall, recorded_at, weather_date)
                        VALUES
                            (:location, :temperature, :humidity,
                             :rainfall, NOW(), :weather_date)
                        ON DUPLICATE KEY UPDATE
                            temperature = VALUES(temperature),
                            humidity = VALUES(humidity),
                            rainfall = VALUES(rainfall),
                            recorded_at = NOW()
                    """),
                    {
                        "location": location_name,
                        "temperature": temperature,
                        "humidity": humidity,
                        "rainfall": rainfall,
                        "weather_date": weather_date
                    }
                )
                saved_count += 1

            rows = connection.execute(
                text("""
                    SELECT location, weather_date, temperature,
                           humidity, rainfall, recorded_at
                    FROM weather_history
                    WHERE location = :location
                      AND weather_date BETWEEN :start_date AND :end_date
                    ORDER BY weather_date DESC
                """),
                {
                    "location": location_name,
                    "start_date": start_date,
                    "end_date": end_date
                }
            ).mappings().all()

        return {
            "success": True,
            "location": location_name,
            "days_requested": days,
            "records_saved_or_updated": saved_count,
            "history": [dict(row) for row in rows],
            "source": "Open-Meteo Historical Weather API"
        }

    except HTTPException:
        raise
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Historical weather provider unavailable: {type(exc).__name__}"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save weather history: {type(exc).__name__}"
        )

@router.get("/weather/saved")
def saved_weather_history(
    city: str = Query(..., min_length=2, max_length=100)
):
    from sqlalchemy import text
    from backend.database import engine

    try:
        with engine.connect() as connection:
            rows = connection.execute(
                text("""
                    SELECT id, location, weather_date,
                           temperature, humidity, rainfall, recorded_at
                    FROM weather_history
                    WHERE LOWER(location) = LOWER(:city)
                    ORDER BY weather_date DESC
                    LIMIT 100
                """),
                {"city": city.strip()}
            ).mappings().all()

        return {
            "success": True,
            "location": city,
            "count": len(rows),
            "history": [dict(row) for row in rows]
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not retrieve saved weather: {type(exc).__name__}"
        )

def generate_weather_alerts(weather_data: dict) -> list[dict]:
    """Generate basic farm weather alerts from a five-day forecast."""
    alerts = []

    daily = weather_data.get("daily", {})

    dates = daily.get("time", [])
    max_temps = daily.get("temperature_2m_max", [])
    rain_probs = daily.get("precipitation_probability_max", [])
    rain_amounts = daily.get("precipitation_sum", [])

    for i, date in enumerate(dates):
        max_temp = max_temps[i] if i < len(max_temps) else None
        rain_prob = rain_probs[i] if i < len(rain_probs) else None
        rain_mm = rain_amounts[i] if i < len(rain_amounts) else None

        if max_temp is not None and max_temp >= 40:
            alerts.append({
                "type": "extreme_heat",
                "severity": "high",
                "date": date,
                "title": "Extreme heat warning",
                "message": (
                    f"Forecast maximum temperature is {max_temp}°C. "
                    "Check soil moisture and crop water needs."
                )
            })

        if rain_prob is not None and rain_mm is not None:
            if rain_prob >= 80 and rain_mm >= 50:
                alerts.append({
                    "type": "heavy_rain",
                    "severity": "high",
                    "date": date,
                    "title": "Heavy rainfall risk",
                    "message": (
                        f"Rain probability is {rain_prob}% with "
                        f"forecast rainfall of {rain_mm} mm. "
                        "Check field drainage and local weather warnings."
                    )
                })

    return alerts


@router.get("/weather/alerts")
def weather_alerts(city: str = Query(..., min_length=2, max_length=100)):
    """Return extreme weather alerts for a city's five-day forecast."""
    weather_data = weather(city)
    alerts = generate_weather_alerts(weather_data)

    return {
        "success": True,
        "location": weather_data["location"],
        "alerts": alerts,
        "count": len(alerts),
        "source": weather_data["source"],
        "note": (
            "These are automated forecast-based screening alerts, "
            "not official government warnings."
        )
    }
