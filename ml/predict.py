# =========================================================
# SENTINELMIND
# Unified Personnel Welfare Risk Prediction Engine
# =========================================================

import joblib
import pandas as pd
import shap

from recommendations import generate_recommendations


# =========================================================
# 1. MODEL
# =========================================================

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "model",
    "stress_model.pkl"
)


# =========================================================
# 2. FEATURES
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
# 3. LOAD MODEL
# =========================================================

model = joblib.load(MODEL_PATH)


# =========================================================
# 4. RISK LEVEL
# =========================================================

def get_risk_level(risk_score):

    if risk_score < 40:
        return "LOW"

    elif risk_score < 70:
        return "MODERATE"

    else:
        return "HIGH"


# =========================================================
# 5. PREDICT RISK
# =========================================================

def predict_risk(personnel):

    # Convert dictionary to DataFrame

    input_df = pd.DataFrame(
        [personnel],
        columns=FEATURES
    )

    # Get probability

    probability = model.predict_proba(
        input_df
    )[0][1]

    risk_score = probability * 100

    risk_level = get_risk_level(
        risk_score
    )

    return risk_score, risk_level, input_df


# =========================================================
# 6. SHAP EXPLANATION
# =========================================================

def get_explanation(input_df):

    explainer = shap.TreeExplainer(model)

    shap_values = explainer.shap_values(
        input_df
    )

    explanation = pd.DataFrame({

        "feature": FEATURES,

        "value": input_df.iloc[0].values,

        "impact": shap_values[0]

    })

    # Absolute impact for ranking

    explanation["absolute_impact"] = (
        explanation["impact"].abs()
    )

    explanation = explanation.sort_values(
        by="absolute_impact",
        ascending=False
    )

    return explanation


# =========================================================
# 7. COMPLETE ANALYSIS
# =========================================================

def analyze_personnel(personnel):

    risk_score, risk_level, input_df = predict_risk(
        personnel
    )

    explanation = get_explanation(
        input_df
    )

    recommendations = generate_recommendations(
        risk_level,
        personnel
    )

    return {
        "risk_score": round(risk_score, 2),

        "risk_level": risk_level,

        "explanation": explanation,

        "recommendations": recommendations
    }


# =========================================================
# 8. DEMO
# =========================================================

if __name__ == "__main__":

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


    # Run complete analysis

    result = analyze_personnel(
        personnel
    )


    # =====================================================
    # DISPLAY RESULT
    # =====================================================

    print()
    print("==============================================")
    print("          SENTINELMIND ANALYSIS")
    print("==============================================")

    print(
        f"Risk Score : {result['risk_score']}%"
    )

    print(
        f"Risk Level : {result['risk_level']}"
    )


    # =====================================================
    # CONTRIBUTING FACTORS
    # =====================================================

    print()
    print("==============================================")
    print("        TOP CONTRIBUTING FACTORS")
    print("==============================================")


    top_factors = result[
        "explanation"
    ].head(5)


    for _, row in top_factors.iterrows():

        if row["impact"] > 0:

            direction = "INCREASES risk"

        else:

            direction = "REDUCES risk"


        print(
            f"- {row['feature']} "
            f"({row['value']}) "
            f"-> {direction}"
        )


    # =====================================================
    # RECOMMENDATIONS
    # =====================================================

    print()
    print("==============================================")
    print("          WELFARE RECOMMENDATIONS")
    print("==============================================")


    for number, recommendation in enumerate(
        result["recommendations"],
        start=1
    ):

        print(
            f"{number}. {recommendation}"
        )


    print()
    print("==============================================")
    print("Human review required before intervention.")
    print("==============================================")