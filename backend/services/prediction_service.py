import joblib
import pandas as pd
import os

MODEL_PATH = os.getenv("MODEL_PATH", "backend/models/crop_yield_pipeline.joblib")
_model = None

def get_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            # Fallback dummy model or raise
            raise FileNotFoundError(f"Model not found at {MODEL_PATH}")
        _model = joblib.load(MODEL_PATH)
    return _model

def predict_yield(data: dict) -> float:
    model = get_model()
    return float(model.predict(pd.DataFrame([data]))[0])
