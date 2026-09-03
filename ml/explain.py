import joblib
import pandas as pd
import shap


# =========================================================
# 1. LOAD TRAINED MODEL
# =========================================================

MODEL_PATH = "model/stress_model.pkl"

model = joblib.load(MODEL_PATH)

print("Model loaded successfully!")


# =========================================================
# 2. DEFINE FEATURES
# =========================================================

FEATURES = [
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


# =========================================================
# 3. CREATE SAMPLE PERSONNEL RECORD
# =========================================================

personnel = {
    "age": 32,
    "deployment_days": 120,
    "daily_duty_hours": 12,
    "night_duties": 10,
    "leave_days": 5,
    "days_since_last_leave": 90,
    "transfer_frequency": 2,
    "training_days": 14,
    "workload_7_days": 85,
    "workload_30_days": 82,
    "sleep_hours": 5.2,
    "wellness_score": 40,
    "self_reported_stress": 78
}


# =========================================================
# 4. CONVERT TO DATAFRAME
# =========================================================

input_df = pd.DataFrame(
    [personnel],
    columns=FEATURES
)


# =========================================================
# 5. PREDICT RISK
# =========================================================

probability = model.predict_proba(input_df)[0][1]

risk_score = probability * 100


if risk_score < 40:
    risk_level = "LOW"

elif risk_score < 70:
    risk_level = "MODERATE"

else:
    risk_level = "HIGH"


# =========================================================
# 6. SHAP EXPLAINABILITY
# =========================================================

explainer = shap.TreeExplainer(model)

shap_values = explainer.shap_values(input_df)


# =========================================================
# 7. CREATE EXPLANATION TABLE
# =========================================================

explanation = pd.DataFrame({
    "feature": FEATURES,
    "value": input_df.iloc[0].values,
    "impact": shap_values[0]
})


# Sort by absolute impact

explanation["absolute_impact"] = (
    explanation["impact"].abs()
)

explanation = explanation.sort_values(
    by="absolute_impact",
    ascending=False
)


# =========================================================
# 8. DISPLAY RESULT
# =========================================================

print("\n======================================")
print("       SENTINELMIND RISK ANALYSIS")
print("======================================")

print(f"Risk Score : {risk_score:.2f}%")
print(f"Risk Level : {risk_level}")


print("\nTop Contributing Factors:")

top_factors = explanation.head(5)

for _, row in top_factors.iterrows():

    direction = "INCREASES" if row["impact"] > 0 else "REDUCES"

    print(
        f"- {row['feature']} "
        f"({row['value']}) "
        f"-> {direction} risk"
    )