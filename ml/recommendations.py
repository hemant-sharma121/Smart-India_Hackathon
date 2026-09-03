# =========================================================
# SENTINELMIND
# Welfare Recommendation Engine
# =========================================================

def generate_recommendations(
    risk_level,
    personnel_data
):
    """
    Generate welfare-focused recommendations.

    Important:
    These are support recommendations, not medical diagnoses
    or disciplinary decisions.
    """

    recommendations = []

    # -----------------------------------------------------
    # HIGH RISK
    # -----------------------------------------------------

    if risk_level == "HIGH":

        recommendations.append(
            "Confidential welfare officer follow-up"
        )

        recommendations.append(
            "Review recent workload and rest schedule"
        )

        recommendations.append(
            "Consider counseling or wellness support"
        )

        recommendations.append(
            "Human review required before any intervention"
        )

    # -----------------------------------------------------
    # MODERATE RISK
    # -----------------------------------------------------

    elif risk_level == "MODERATE":

        recommendations.append(
            "Schedule a confidential welfare check-in"
        )

        recommendations.append(
            "Review workload and recovery time"
        )

        recommendations.append(
            "Encourage voluntary wellness support"
        )

    # -----------------------------------------------------
    # LOW RISK
    # -----------------------------------------------------

    else:

        recommendations.append(
            "Continue routine wellness monitoring"
        )

        recommendations.append(
            "Maintain healthy rest and leave patterns"
        )

    # -----------------------------------------------------
    # FACTOR-SPECIFIC RECOMMENDATIONS
    # -----------------------------------------------------

    if personnel_data["daily_duty_hours"] >= 11:

        recommendations.append(
            "Review prolonged duty-hour exposure"
        )

    if personnel_data["deployment_days"] >= 90:

        recommendations.append(
            "Review extended deployment and recovery opportunities"
        )

    if personnel_data["night_duties"] >= 8:

        recommendations.append(
            "Review night-duty frequency and rest periods"
        )

    if personnel_data["days_since_last_leave"] >= 75:

        recommendations.append(
            "Review leave/recovery opportunity"
        )

    if personnel_data["sleep_hours"] < 6:

        recommendations.append(
            "Review sleep and recovery pattern"
        )

    if personnel_data["workload_7_days"] >= 80:

        recommendations.append(
            "Review recent workload intensity"
        )

    if personnel_data["self_reported_stress"] >= 70:

        recommendations.append(
            "Offer confidential wellness support"
        )

    return recommendations


# =========================================================
# TEST
# =========================================================

if __name__ == "__main__":

    personnel = {
        "daily_duty_hours": 12,
        "deployment_days": 120,
        "night_duties": 10,
        "days_since_last_leave": 90,
        "sleep_hours": 5.2,
        "workload_7_days": 85,
        "self_reported_stress": 78
    }

    risk_level = "HIGH"

    recommendations = generate_recommendations(
        risk_level,
        personnel
    )

    print("\n======================================")
    print("       WELFARE RECOMMENDATIONS")
    print("======================================")

    for number, recommendation in enumerate(
        recommendations,
        start=1
    ):
        print(f"{number}. {recommendation}")