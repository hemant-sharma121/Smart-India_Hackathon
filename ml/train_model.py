import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score
)

from xgboost import XGBClassifier


# =========================================================
# 1. LOAD DATASET
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

PROJECT_DIR = os.path.dirname(BASE_DIR)

data_path = os.path.join(
    PROJECT_DIR,
    "data",
    "personnel_wellness.csv"
)

df = pd.read_csv(data_path)

print("Dataset loaded successfully!")
print("Number of records:", len(df))


# =========================================================
# 2. SELECT FEATURES
# =========================================================

features = [
    "age",
    "deployment_days",
    "daily_duty_hours",
    "night_duties",
    "leave_days",
    "days_since_last_leave",
    "transfer_frequency",
    "training_days",
    "workload_7_days",
    "workload_30_days",
    "sleep_hours",
    "wellness_score",
    "self_reported_stress"
]

X = df[features]

y = df["stress_risk"]


# =========================================================
# 3. SPLIT DATA
# =========================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\nData split completed.")

print("Training records:", len(X_train))
print("Testing records:", len(X_test))


# =========================================================
# 4. CREATE XGBOOST MODEL
# =========================================================

model = XGBClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    eval_metric="logloss"
)


# =========================================================
# 5. TRAIN MODEL
# =========================================================

print("\nTraining XGBoost model...")

model.fit(X_train, y_train)

print("Model training completed!")


# =========================================================
# 6. MAKE PREDICTIONS
# =========================================================

y_pred = model.predict(X_test)

y_probability = model.predict_proba(X_test)[:, 1]


# =========================================================
# 7. EVALUATE MODEL
# =========================================================

accuracy = accuracy_score(
    y_test,
    y_pred
)

auc = roc_auc_score(
    y_test,
    y_probability
)


print("\n======================================")
print("        SENTINELMIND MODEL")
print("======================================")

print(f"Accuracy : {accuracy:.4f}")
print(f"ROC-AUC  : {auc:.4f}")

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        y_pred
    )
)

print("\nConfusion Matrix:")
print(
    confusion_matrix(
        y_test,
        y_pred
    )
)


# =========================================================
# 8. FEATURE IMPORTANCE
# =========================================================

importance = pd.DataFrame({
    "feature": features,
    "importance": model.feature_importances_
})

importance = importance.sort_values(
    by="importance",
    ascending=False
)

print("\n======================================")
print("        FEATURE IMPORTANCE")
print("======================================")

print(importance.to_string(index=False))


# =========================================================
# 9. SAVE MODEL
# =========================================================

os.makedirs("model", exist_ok=True)

model_path = "model/stress_model.pkl"

joblib.dump(
    model,
    model_path
)

print("\n======================================")
print("Model saved successfully!")
print("Location:", model_path)
print("======================================")