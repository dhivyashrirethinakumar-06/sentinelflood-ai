import os
import pickle
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

# Try loading XGBoost
try:
    from xgboost import XGBClassifier
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False

def train_and_evaluate_multi_district():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(script_dir, "datasets", "flood_dataset.csv")

    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Regenerated flood dataset not found at {dataset_path}.")

    print(f"Loading large multi-district dataset from {dataset_path}...")
    df = pd.read_csv(dataset_path)

    # 1. Feature Engineering
    print("\n--- DATA PROCESSING & FEATURE ENGINEERING ---")
    
    # Calculate engineered "Storm_Index"
    df["Storm_Index"] = (df["Rainfall"] * 0.5) + (df["Water_Level"] * 15.0) + (df["Wind_Speed"] * 0.2)
    print("Engineered feature 'Storm_Index' calculated.")

    # 2. Categorical Label Encoding for District strings
    print("\n--- ENCODING DISTRICT LABELS ---")
    le = LabelEncoder()
    df["District_Encoded"] = le.fit_transform(df["District"])
    
    # Save fitted label encoder
    encoder_path = os.path.join(script_dir, "district_encoder.pkl")
    with open(encoder_path, "wb") as f:
        pickle.dump(le, f)
    print(f"District LabelEncoder successfully fit and saved to {encoder_path}")
    print(f"Encoded {len(le.classes_)} unique Tamil Nadu districts.")

    # Features order (ensure District_Encoded is index 0)
    features = ["District_Encoded", "Rainfall", "Water_Level", "Humidity", "Temperature", "Wind_Speed", "Storm_Index"]
    X = df[features]
    y = df["Flood_Occurrence"]

    # 3. Train-Test Split (stratified)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    print(f"Train size: {X_train.shape[0]} | Test size: {X_test.shape[0]}")

    # 4. Standard Feature Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Save fitted scaler
    scaler_path = os.path.join(script_dir, "scaler.pkl")
    with open(scaler_path, "wb") as f:
        pickle.dump(scaler, f)
    print(f"Feature StandardScaler saved to {scaler_path}")

    # 5. Model Training & Evaluation
    models = {}

    # 5a. Random Forest Classifier
    print("\n--- TRAINING SCALED RANDOM FOREST ENSEMBLE (100,000 ROWS) ---")
    rf = RandomForestClassifier(n_estimators=100, max_depth=12, min_samples_split=5, random_state=42, n_jobs=-1)
    rf.fit(X_train_scaled, y_train)
    rf_preds = rf.predict(X_test_scaled)
    
    rf_metrics = {
        "Accuracy": accuracy_score(y_test, rf_preds),
        "Precision": precision_score(y_test, rf_preds),
        "Recall": recall_score(y_test, rf_preds),
        "F1_Score": f1_score(y_test, rf_preds),
        "Confusion_Matrix": confusion_matrix(y_test, rf_preds).tolist()
    }
    models["Random_Forest"] = (rf, rf_metrics)
    print("Random Forest training complete.")

    # 5b. XGBoost / GradientBoosting Classifier
    if XGB_AVAILABLE:
        print("\n--- TRAINING SCALED XGBOOST CLASSIFIER (100,000 ROWS) ---")
        xgb = XGBClassifier(
            n_estimators=120, 
            max_depth=7, 
            learning_rate=0.08, 
            random_state=42, 
            n_jobs=-1,
            eval_metric='logloss'
        )
        xgb.fit(X_train_scaled, y_train)
        xgb_preds = xgb.predict(X_test_scaled)
        
        xgb_metrics = {
            "Accuracy": accuracy_score(y_test, xgb_preds),
            "Precision": precision_score(y_test, xgb_preds),
            "Recall": recall_score(y_test, xgb_preds),
            "F1_Score": f1_score(y_test, xgb_preds),
            "Confusion_Matrix": confusion_matrix(y_test, xgb_preds).tolist()
        }
        models["XGBoost"] = (xgb, xgb_metrics)
        print("XGBoost training complete.")
    else:
        print("\n--- TRAINING GRADIENT BOOSTING ENSEMBLE FALLBACK (100,000 ROWS) ---")
        from sklearn.ensemble import GradientBoostingClassifier
        gb = GradientBoostingClassifier(n_estimators=100, max_depth=7, learning_rate=0.08, random_state=42)
        gb.fit(X_train_scaled, y_train)
        gb_preds = gb.predict(X_test_scaled)
        
        xgb_metrics = {
            "Accuracy": accuracy_score(y_test, gb_preds),
            "Precision": precision_score(y_test, gb_preds),
            "Recall": recall_score(y_test, gb_preds),
            "F1_Score": f1_score(y_test, gb_preds),
            "Confusion_Matrix": confusion_matrix(y_test, gb_preds).tolist()
        }
        models["XGBoost"] = (gb, xgb_metrics)
        print("Gradient Boosting training complete.")

    # 6. Evaluation and Model Comparison Logging
    print("\n==========================================")
    print("        RETRAINED MODEL COMPARISON        ")
    print("==========================================")
    print(f"{'Metric':<15} | {'Random Forest':<15} | {'XGBoost / GradientBoost':<25}")
    print("-" * 65)
    for metric in ["Accuracy", "Precision", "Recall", "F1_Score"]:
        rf_val = models["Random_Forest"][1][metric]
        xgb_val = models["XGBoost"][1][metric]
        print(f"{metric:<15} | {rf_val:<15.4f} | {xgb_val:<25.4f}")
    
    # Save the highest accuracy model
    best_model_name = "XGBoost" if models["XGBoost"][1]["Accuracy"] >= models["Random_Forest"][1]["Accuracy"] else "Random_Forest"
    best_model, best_metrics = models[best_model_name]
    
    print(f"\nOptimal Model Selected: {best_model_name}")

    # Export pickled optimal model binary
    model_path = os.path.join(script_dir, "flood_model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(best_model, f)
    print(f"Optimal pickled model successfully exported to {model_path}")

    # Write JSON metadata
    importances = best_model.feature_importances_
    feature_importances = {feat: float(imp) for feat, imp in zip(features, importances)}
    
    metadata = {
        "best_model": best_model_name,
        "features": features,
        "rf_metrics": models["Random_Forest"][1],
        "xgb_metrics": models["XGBoost"][1],
        "feature_importances": feature_importances
    }
    
    metadata_path = os.path.join(script_dir, "model_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=4)
    print(f"Retrained metrics metadata written to {metadata_path}!")

if __name__ == "__main__":
    train_and_evaluate_multi_district()
