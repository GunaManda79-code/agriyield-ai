import pandas as pd
import joblib
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

def evaluate_pipeline(test_csv_path: str, model_path: str = "ml/models/crop_yield_pipeline.joblib"):
    model = joblib.load(model_path)
    df = pd.read_csv(test_csv_path)
    preds = model.predict(df.drop(columns=["yield"]))
    print(f"MAE: {mean_absolute_error(df['yield'], preds):.4f}")
    print(f"RMSE: {root_mean_squared_error(df['yield'], preds):.4f}")
    print(f"R2: {r2_score(df['yield'], preds):.4f}")

if __name__ == "__main__":
    pass
