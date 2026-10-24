import pandas as pd
from sklearn.model_selection import train_test_split
import os

def prepare_dataset(csv_path: str, output_dir: str = "dataset/processed"):
    os.makedirs(output_dir, exist_ok=True)
    df = pd.read_csv(csv_path)
    df = df.dropna().drop_duplicates()
    X = df.drop(columns=["yield"])
    y = df["yield"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    pd.concat([X_train, y_train], axis=1).to_csv(os.path.join(output_dir, "train.csv"), index=False)
    pd.concat([X_test, y_test], axis=1).to_csv(os.path.join(output_dir, "test.csv"), index=False)
    print("Dataset prepared.")

if __name__ == "__main__":
    pass
