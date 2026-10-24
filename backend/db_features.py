import os
import sqlite3
from pathlib import Path
from contextlib import contextmanager

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = PROJECT_ROOT / "crop_yield.db"
DB_PATH = Path(os.getenv("AGRIYIELD_DB_PATH", str(DEFAULT_DB))).resolve()


def init_feature_tables():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS soil_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            farmer_name TEXT NOT NULL DEFAULT 'Farmer',
            location TEXT NOT NULL,
            crop TEXT NOT NULL,
            soil_ph REAL,
            nitrogen REAL,
            phosphorus REAL,
            potassium REAL,
            soil_moisture REAL,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )""")
        conn.execute("""
        CREATE TABLE IF NOT EXISTS farm_profit_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            crop TEXT NOT NULL,
            land_area REAL NOT NULL,
            area_unit TEXT NOT NULL DEFAULT 'acres',
            expected_yield REAL NOT NULL,
            expected_price REAL NOT NULL,
            total_cost REAL NOT NULL,
            estimated_revenue REAL NOT NULL,
            estimated_profit REAL NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS prediction_history_addon (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            crop TEXT NOT NULL,
            predicted_yield REAL NOT NULL,
            unit TEXT NOT NULL DEFAULT 'tonnes/hectare',
            input_json TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )""")

        conn.execute("""
        CREATE TABLE IF NOT EXISTS market_price_samples (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            crop TEXT NOT NULL,
            market TEXT NOT NULL,
            price_per_quintal REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'INR',
            price_date TEXT NOT NULL,
            source_note TEXT NOT NULL DEFAULT 'Sample data — verify before use',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )""")

        # Keep the original fallback sample records.
        count = conn.execute(
            "SELECT COUNT(*) FROM market_price_samples"
        ).fetchone()[0]

        if count == 0:
            sample = [
                ("Paddy", "Example market", 2200, "INR",
                 "2026-10-01", "DEMO ONLY — not a live market quote"),
                ("Maize", "Example market", 1900, "INR",
                 "2026-10-01", "DEMO ONLY — not a live market quote"),
                ("Cotton", "Example market", 7000, "INR",
                 "2026-10-01", "DEMO ONLY — not a live market quote"),
            ]

            conn.executemany("""
                INSERT INTO market_price_samples
                (crop, market, price_per_quintal, currency,
                 price_date, source_note)
                VALUES (?, ?, ?, ?, ?, ?)
            """, sample)

        # Import the estimated dataset.
        from backend.estimated_market_data import ESTIMATED_MARKET_DATA

        demo_note = "SIMULATED ESTIMATE — NOT A REAL MARKET QUOTE"
        dataset_date = "2026-10-18"

        # Insert each missing record individually.
        for item in ESTIMATED_MARKET_DATA:
            market_location = (
                f'{item["market"]}, '
                f'{item["district"]}, '
                f'{item["state"]}'
            )

            exists = conn.execute("""
                SELECT 1
                FROM market_price_samples
                WHERE crop = ?
                  AND market = ?
                  AND price_per_quintal = ?
                  AND price_date = ?
                  AND source_note = ?
                LIMIT 1
            """, (
                item["crop"],
                market_location,
                item["modal_price"],
                dataset_date,
                demo_note,
            )).fetchone()

            if not exists:
                conn.execute("""
                    INSERT INTO market_price_samples
                    (crop, market, price_per_quintal, currency,
                     price_date, source_note)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    item["crop"],
                    market_location,
                    item["modal_price"],
                    "INR",
                    dataset_date,
                    demo_note,
                ))

        conn.commit()


@contextmanager
def get_db():
    init_feature_tables()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()



def save_prediction_history(
    crop,
    predicted_yield,
    unit="tonnes/hectare",
    input_data=None,
    user_id=None,
):
    import json
    from sqlalchemy import text
    from backend.database import engine

    with engine.begin() as connection:
        connection.execute(
            text("""
                INSERT INTO prediction_history
                    (user_id, crop, predicted_yield, unit, input_json)
                VALUES
                    (:user_id, :crop, :predicted_yield, :unit, :input_json)
            """),
            {
                "user_id": user_id,
                "crop": crop,
                "predicted_yield": float(predicted_yield),
                "unit": unit,
                "input_json": json.dumps(input_data or {}),
            },
        )

