import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

DATASET_PATH = "dataset/crop_yield_dataset.csv"
MODEL_PATH = "backend/models/crop_yield_pipeline.joblib"


def train_pipeline():
    print("Loading crop-yield dataset...")

    df = pd.read_csv(DATASET_PATH)
    df.columns = df.columns.str.strip()

    # Match the dataset's column names to the prediction API.
    df = df.rename(columns={
        "Crop": "crop",
        "Rainfall": "rainfall",
        "Temperature": "temperature",
        "Humidity": "humidity",
        "pH": "soil_ph",
        "Nitrogen": "nitrogen",
        "Phosphorus": "phosphorus",
        "Potassium": "potassium",
        "Yield": "yield"
    })

    features = [
        "crop", "rainfall", "temperature", "humidity",
        "soil_ph", "nitrogen", "phosphorus", "potassium"
    ]

    missing = [column for column in features + ["yield"]
               if column not in df.columns]

    if missing:
        raise ValueError(f"Dataset is missing columns: {missing}")

    df = df[features + ["yield"]].copy()

    for column in features:
        if column != "crop":
            df[column] = pd.to_numeric(df[column], errors="coerce")

    df["yield"] = pd.to_numeric(df["yield"], errors="coerce")
    df = df.dropna(subset=features + ["yield"])
    df = df.sample(n=min(20000, len(df)), random_state=42)
    df = df[df["yield"] >= 0]

    if len(df) < 20:
        raise ValueError("Not enough valid rows to train the model.")

    print(f"Valid records: {len(df):,}")
    print("Splitting data...")

    X = df[features]
    y = df["yield"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    preprocessor = ColumnTransformer(transformers=[
        ("numeric", StandardScaler(), [
            "rainfall", "temperature", "humidity", "soil_ph",
            "nitrogen", "phosphorus", "potassium"
        ]),
        ("crop", OneHotEncoder(handle_unknown="ignore"), ["crop"])
    ])

    model = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", RandomForestRegressor(
            n_estimators=20,
            max_depth=12,
            random_state=42,
            n_jobs=2
        ))
    ])

    print("Training model...")
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)
    rmse = mean_squared_error(y_test, predictions) ** 0.5
    r2 = r2_score(y_test, predictions)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    print("\nTraining complete!")
    print(f"Training records: {len(X_train):,}")
    print(f"Test records: {len(X_test):,}")
    print(f"MAE: {mae:.3f} yield units")
    print(f"RMSE: {rmse:.3f} yield units")
    print(f"R²: {r2:.4f}")
    print(f"Saved model: {MODEL_PATH}")
    print("\nImportant: verify the dataset's yield unit before displaying")
    print("predictions as tonnes/hectare.")


if __name__ == "__main__":
    train_pipeline()