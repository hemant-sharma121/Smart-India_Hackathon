# =========================================================
# SENTINELMIND
# FastAPI Backend
# =========================================================

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import sys
import os
from datetime import datetime


# ---------------------------------------------------------
# Add ml folder to Python path
# ---------------------------------------------------------

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(CURRENT_DIR)
ML_DIR = os.path.join(PROJECT_DIR, "ml")

sys.path.append(ML_DIR)


# ---------------------------------------------------------
# Import SentinelMind AI engine
# ---------------------------------------------------------

from predict import analyze_personnel

from backend.database import SessionLocal
from backend.models import Personnel, RiskPrediction, WellnessCheckin, AuditLog


# =========================================================
# CREATE FASTAPI APP
# =========================================================

app = FastAPI(
    title="SentinelMind API",
    description="AI-powered Personnel Stress and Welfare Monitoring System",
    version="1.0.0"
)

# =========================================================
# CORS CONFIGURATION
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# PERSONNEL DATA MODEL
# =========================================================

class PersonnelData(BaseModel):

    age: int = Field(..., ge=18, le=70)

    deployment_days: int = Field(..., ge=0)

    daily_duty_hours: float = Field(
        ...,
        ge=0,
        le=24
    )

    night_duties: int = Field(..., ge=0)

    leave_days: int = Field(..., ge=0)

    days_since_last_leave: int = Field(..., ge=0)

    transfer_frequency: int = Field(..., ge=0)

    training_days: int = Field(..., ge=0)

    workload_7_days: float = Field(
        ...,
        ge=0,
        le=100
    )

    workload_30_days: float = Field(
        ...,
        ge=0,
        le=100
    )

    sleep_hours: float = Field(
        ...,
        ge=0,
        le=24
    )

    wellness_score: float = Field(
        ...,
        ge=0,
        le=100
    )

    self_reported_stress: float = Field(
        ...,
        ge=0,
        le=100
    )


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {
        "message": "SentinelMind API is running",
        "status": "online"
    }


# =========================================================
# PREDICTION API
# =========================================================

@app.post("/predict")
def predict(personnel: PersonnelData):

    try:

        # Convert Pydantic object to normal Python dictionary

        personnel_data = personnel.model_dump()

        # Run AI analysis

        result = analyze_personnel(
            personnel_data
        )

        # -------------------------------------------------
        # SHAP explanation
        # -------------------------------------------------

        explanation = result["explanation"]

        top_factors = []

        for _, row in explanation.head(5).iterrows():

            impact = float(row["impact"])
            value = float(row["value"])

            top_factors.append({

                "feature": str(row["feature"]),

                "value": value,

                "impact": impact,

                "direction":
                    "INCREASES risk"
                    if impact > 0
                    else
                    "REDUCES risk"
            })


        # -------------------------------------------------
        # Recommendations
        # -------------------------------------------------

        recommendations = [
            str(item)
            for item in result["recommendations"]
        ]


        # -------------------------------------------------
        # Final JSON-safe response
        # -------------------------------------------------

        return {

            "risk_score":
                float(result["risk_score"]),

            "risk_level":
                str(result["risk_level"]),

            "contributing_factors":
                top_factors,

            "recommendations":
                recommendations,

            "human_review_required":
                True,

            "disclaimer":
                "This output is a welfare risk indicator, "
                "not a clinical diagnosis."
        }


    except Exception as e:

        print("ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# =========================================================
# ADD PERSONNEL TO DATABASE
# =========================================================

@app.post("/personnel")
def add_personnel(personnel: PersonnelData):

    db = SessionLocal()

    try:

        # Create a new personnel record
        new_personnel = Personnel(

            personnel_id=f"P{personnel.age}{personnel.deployment_days}",

            age=personnel.age,

            deployment_days=personnel.deployment_days,

            daily_duty_hours=personnel.daily_duty_hours,

            night_duties=personnel.night_duties,

            leave_days=personnel.leave_days,

            days_since_last_leave=personnel.days_since_last_leave,

            transfer_frequency=personnel.transfer_frequency,

            training_days=personnel.training_days,

            workload_7_days=personnel.workload_7_days,

            workload_30_days=personnel.workload_30_days,

            sleep_hours=personnel.sleep_hours,

            wellness_score=personnel.wellness_score,

            self_reported_stress=personnel.self_reported_stress

        )

        db.add(new_personnel)

        db.commit()

        db.refresh(new_personnel)

        return {
            "message": "Personnel added successfully",
            "personnel_id": new_personnel.personnel_id
        }

    finally:

        db.close()
# =========================================================
# GET ALL PERSONNEL
# =========================================================

@app.get("/personnel")
def get_personnel():

    db = SessionLocal()

    try:

        personnel_list = db.query(Personnel).all()

        result = []

        for person in personnel_list:

            result.append({
                "personnel_id": person.personnel_id,
                "age": person.age,
                "unit": person.unit,
                "deployment_days": person.deployment_days,
                "daily_duty_hours": person.daily_duty_hours,
                "night_duties": person.night_duties,
                "leave_days": person.leave_days,
                "days_since_last_leave": person.days_since_last_leave,
                "transfer_frequency": person.transfer_frequency,
                "training_days": person.training_days,
                "workload_7_days": person.workload_7_days,
                "workload_30_days": person.workload_30_days,
                "sleep_hours": person.sleep_hours,
                "wellness_score": person.wellness_score,
                "self_reported_stress": person.self_reported_stress
            })

        return result

    finally:

        db.close()
# =========================================================
# GET ONE PERSONNEL RECORD
# =========================================================

@app.get("/personnel/{personnel_id}")
def get_one_personnel(personnel_id: str):

    db = SessionLocal()

    try:

        person = (
            db.query(Personnel)
            .filter(
                Personnel.personnel_id == personnel_id
            )
            .first()
        )

        if person is None:

            raise HTTPException(
                status_code=404,
                detail="Personnel not found"
            )

        return {
            "personnel_id": person.personnel_id,
            "age": person.age,
            "unit": person.unit,
            "deployment_days": person.deployment_days,
            "daily_duty_hours": person.daily_duty_hours,
            "night_duties": person.night_duties,
            "leave_days": person.leave_days,
            "days_since_last_leave":
                person.days_since_last_leave,
            "transfer_frequency":
                person.transfer_frequency,
            "training_days":
                person.training_days,
            "workload_7_days":
                person.workload_7_days,
            "workload_30_days":
                person.workload_30_days,
            "sleep_hours":
                person.sleep_hours,
            "wellness_score":
                person.wellness_score,
            "self_reported_stress":
                person.self_reported_stress
        }

    finally:

        db.close()

# =========================================================
# ANALYZE PERSONNEL FROM DATABASE
# =========================================================

@app.get("/personnel/{personnel_id}/analysis")
def analyze_stored_personnel(personnel_id: str):

    db = SessionLocal()

    try:

        # -------------------------------------------------
        # Find personnel in database
        # -------------------------------------------------

        person = (
            db.query(Personnel)
            .filter(
                Personnel.personnel_id == personnel_id
            )
            .first()
        )

        if person is None:

            raise HTTPException(
                status_code=404,
                detail="Personnel not found"
            )


        # -------------------------------------------------
        # Get latest wellness check-in
        # -------------------------------------------------

        latest_checkin = (
            db.query(WellnessCheckin)
            .filter(
                WellnessCheckin.personnel_id == personnel_id
            )
            .order_by(
                WellnessCheckin.id.desc()
            )
            .first()
        )

        # -------------------------------------------------
        # Use latest wellness data when available
        # -------------------------------------------------

        if latest_checkin:

            sleep_hours = latest_checkin.sleep_hours

            wellness_score = latest_checkin.wellness_score

            self_reported_stress = (
                    latest_checkin.stress_level * 10
            )

        else:

            sleep_hours = person.sleep_hours

            wellness_score = person.wellness_score

            self_reported_stress = person.self_reported_stress

        # -------------------------------------------------
        # Prepare data for ML model
        # -------------------------------------------------

        personnel_data = {

            "age": person.age,

            "deployment_days":
                person.deployment_days,

            "daily_duty_hours":
                person.daily_duty_hours,

            "night_duties":
                person.night_duties,

            "leave_days":
                person.leave_days,

            "days_since_last_leave":
                person.days_since_last_leave,

            "transfer_frequency":
                person.transfer_frequency,

            "training_days":
                person.training_days,

            "workload_7_days":
                person.workload_7_days,

            "workload_30_days":
                person.workload_30_days,

            "sleep_hours":
                sleep_hours,

            "wellness_score":
                wellness_score,

            "self_reported_stress":
                self_reported_stress
        }

        # -------------------------------------------------
        # Run SentinelMind AI
        # -------------------------------------------------

        result = analyze_personnel(
            personnel_data
        )

        # -------------------------------------------------
        # Convert SHAP explanation
        # -------------------------------------------------

        explanation = result["explanation"]

        top_factors = []

        for _, row in explanation.head(5).iterrows():

            impact = float(row["impact"])

            value = float(row["value"])

            top_factors.append({

                "feature":
                    str(row["feature"]),

                "value":
                    value,

                "impact":
                    impact,

                "direction":
                    (
                        "INCREASES risk"
                        if impact > 0
                        else
                        "REDUCES risk"
                    )
            })

        # -------------------------------------------------
        # Recommendations
        # -------------------------------------------------

        recommendations = [
            str(item)
            for item in result["recommendations"]
        ]

        # -------------------------------------------------
        # Save prediction to database
        # -------------------------------------------------

        prediction = RiskPrediction(
            personnel_id=person.personnel_id,

            risk_score=float(result["risk_score"]),

            risk_level=str(result["risk_level"]),

            top_factors=top_factors,

            recommendations=recommendations,

            created_at=datetime.now()
        )

        db.add(prediction)

        db.commit()

        db.refresh(prediction)
        # -------------------------------------------------
        # Final response
        # -------------------------------------------------

        return {

            "personnel_id":
                person.personnel_id,

            "risk_score":
                float(result["risk_score"]),

            "risk_level":
                str(result["risk_level"]),

            "contributing_factors":
                top_factors,

            "recommendations":
                recommendations,

            "human_review_required":
                True,

            "disclaimer":
                "This output is a welfare risk indicator, "
                "not a clinical diagnosis."
        }

    finally:

        db.close()

# =========================================================
# GET SAVED RISK PREDICTIONS
# =========================================================

@app.get("/predictions")
def get_predictions():

    db = SessionLocal()

    try:

        predictions = (
            db.query(RiskPrediction)
            .order_by(RiskPrediction.id.desc())
            .all()
        )

        result = []

        for prediction in predictions:

            result.append({

                "id": prediction.id,

                "personnel_id":
                    prediction.personnel_id,

                "risk_score":
                    float(prediction.risk_score),

                "risk_level":
                    prediction.risk_level,

                "top_factors":
                    prediction.top_factors,

                "recommendations":
                    prediction.recommendations,

                "created_at":
                    prediction.created_at
            })

        return result

    finally:

        db.close()

# =========================================================
# WELLNESS CHECK-IN DATA MODEL
# =========================================================

class WellnessCheckinData(BaseModel):

    personnel_id: str

    sleep_hours: float = Field(
        ...,
        ge=0,
        le=24
    )

    stress_level: float = Field(
        ...,
        ge=0,
        le=10
    )

    energy_level: float = Field(
        ...,
        ge=0,
        le=10
    )

    wellness_score: float = Field(
        ...,
        ge=0,
        le=100
    )

    workload_level: str

# =========================================================
# SAVE WELLNESS CHECK-IN
# =========================================================

@app.post("/wellness-checkin")
def save_wellness_checkin(checkin: WellnessCheckinData):

    db = SessionLocal()

    try:

        # Check whether the personnel exists
        person = (
            db.query(Personnel)
            .filter(
                Personnel.personnel_id == checkin.personnel_id
            )
            .first()
        )

        if person is None:

            raise HTTPException(
                status_code=404,
                detail="Personnel not found"
            )

        # Create wellness check-in
        new_checkin = WellnessCheckin(

            personnel_id=checkin.personnel_id,

            sleep_hours=checkin.sleep_hours,

            stress_level=checkin.stress_level,

            energy_level=checkin.energy_level,

            wellness_score=checkin.wellness_score,

            workload_level=checkin.workload_level

        )

        db.add(new_checkin)

        db.commit()

        db.refresh(new_checkin)

        return {
            "message": "Wellness check-in saved successfully",
            "checkin_id": new_checkin.id,
            "personnel_id": new_checkin.personnel_id
        }

    finally:

        db.close()

# =========================================================
# GET WELLNESS CHECK-IN HISTORY
# =========================================================

@app.get("/wellness-checkins/{personnel_id}")
def get_wellness_history(personnel_id: str):

    db = SessionLocal()

    try:

        # Check whether personnel exists
        person = (
            db.query(Personnel)
            .filter(
                Personnel.personnel_id == personnel_id
            )
            .first()
        )

        if person is None:

            raise HTTPException(
                status_code=404,
                detail="Personnel not found"
            )

        # Get all wellness check-ins
        checkins = (
            db.query(WellnessCheckin)
            .filter(
                WellnessCheckin.personnel_id == personnel_id
            )
            .all()
        )

        result = []

        for checkin in checkins:

            result.append({

                "checkin_id":
                    checkin.id,

                "personnel_id":
                    checkin.personnel_id,

                "sleep_hours":
                    float(checkin.sleep_hours),

                "stress_level":
                    float(checkin.stress_level),

                "energy_level":
                    float(checkin.energy_level),

                "wellness_score":
                    float(checkin.wellness_score),

                "workload_level":
                    checkin.workload_level,

                "created_at":
                    checkin.created_at
            })

        return result

    finally:

        db.close()

# =========================================================
# GET LATEST WELLNESS CHECK-IN
# =========================================================

@app.get("/wellness-checkins/{personnel_id}/latest")
def get_latest_wellness_checkin(personnel_id: str):

    db = SessionLocal()

    try:

        person = (
            db.query(Personnel)
            .filter(
                Personnel.personnel_id == personnel_id
            )
            .first()
        )

        if person is None:

            raise HTTPException(
                status_code=404,
                detail="Personnel not found"
            )

        checkin = (
            db.query(WellnessCheckin)
            .filter(
                WellnessCheckin.personnel_id == personnel_id
            )
            .order_by(
                WellnessCheckin.id.desc()
            )
            .first()
        )

        if checkin is None:

            raise HTTPException(
                status_code=404,
                detail="No wellness check-in found"
            )

        return {
            "checkin_id": checkin.id,
            "personnel_id": checkin.personnel_id,
            "sleep_hours": float(checkin.sleep_hours),
            "stress_level": float(checkin.stress_level),
            "energy_level": float(checkin.energy_level),
            "wellness_score": float(checkin.wellness_score),
            "workload_level": checkin.workload_level,
            "created_at": checkin.created_at
        }

    finally:

        db.close()

# =========================================================
# WELLNESS TREND ANALYSIS
# =========================================================

@app.get("/wellness-checkins/{personnel_id}/trend")
def get_wellness_trend(personnel_id: str):

    db = SessionLocal()

    try:

        # -------------------------------------------------
        # Check whether personnel exists
        # -------------------------------------------------

        person = (
            db.query(Personnel)
            .filter(
                Personnel.personnel_id == personnel_id
            )
            .first()
        )

        if person is None:

            raise HTTPException(
                status_code=404,
                detail="Personnel not found"
            )

        # -------------------------------------------------
        # Get check-ins
        # -------------------------------------------------

        checkins = (
            db.query(WellnessCheckin)
            .filter(
                WellnessCheckin.personnel_id == personnel_id
            )
            .order_by(
                WellnessCheckin.id.asc()
            )
            .all()
        )

        if len(checkins) == 0:

            raise HTTPException(
                status_code=404,
                detail="No wellness check-ins found"
            )

        # -------------------------------------------------
        # Extract values
        # -------------------------------------------------

        wellness_scores = [
            float(c.wellness_score)
            for c in checkins
        ]

        stress_levels = [
            float(c.stress_level)
            for c in checkins
        ]

        sleep_hours = [
            float(c.sleep_hours)
            for c in checkins
        ]

        # -------------------------------------------------
        # Calculate averages
        # -------------------------------------------------

        average_wellness = (
            sum(wellness_scores)
            / len(wellness_scores)
        )

        average_stress = (
            sum(stress_levels)
            / len(stress_levels)
        )

        average_sleep = (
            sum(sleep_hours)
            / len(sleep_hours)
        )

        # -------------------------------------------------
        # Calculate simple trends
        # -------------------------------------------------

        if len(checkins) >= 2:

            first_wellness = wellness_scores[0]
            last_wellness = wellness_scores[-1]

            first_stress = stress_levels[0]
            last_stress = stress_levels[-1]

            first_sleep = sleep_hours[0]
            last_sleep = sleep_hours[-1]

            # Wellness
            if last_wellness > first_wellness:
                wellness_trend = "IMPROVING"

            elif last_wellness < first_wellness:
                wellness_trend = "DECLINING"

            else:
                wellness_trend = "STABLE"

            # Stress
            if last_stress < first_stress:
                stress_trend = "IMPROVING"

            elif last_stress > first_stress:
                stress_trend = "WORSENING"

            else:
                stress_trend = "STABLE"

            # Sleep
            if last_sleep > first_sleep:
                sleep_trend = "IMPROVING"

            elif last_sleep < first_sleep:
                sleep_trend = "DECLINING"

            else:
                sleep_trend = "STABLE"

        else:

            wellness_trend = "INSUFFICIENT_DATA"
            stress_trend = "INSUFFICIENT_DATA"
            sleep_trend = "INSUFFICIENT_DATA"

        # -------------------------------------------------
        # Return trend analysis
        # -------------------------------------------------

        return {

            "personnel_id":
                personnel_id,

            "number_of_checkins":
                len(checkins),

            "average_wellness_score":
                round(average_wellness, 2),

            "average_stress_level":
                round(average_stress, 2),

            "average_sleep_hours":
                round(average_sleep, 2),

            "wellness_trend":
                wellness_trend,

            "stress_trend":
                stress_trend,

            "sleep_trend":
                sleep_trend,

            "history": [

                {
                    "checkin_id": c.id,
                    "wellness_score":
                        float(c.wellness_score),
                    "stress_level":
                        float(c.stress_level),
                    "sleep_hours":
                        float(c.sleep_hours),
                    "energy_level":
                        float(c.energy_level),
                    "workload_level":
                        c.workload_level
                }

                for c in checkins
            ]
        }

    finally:

        db.close()

# =========================================================
# DASHBOARD SUMMARY
# =========================================================

@app.get("/dashboard/summary")
def get_dashboard_summary():

    db = SessionLocal()

    try:

        # -------------------------------------------------
        # Total personnel
        # -------------------------------------------------

        personnel_records = (
            db.query(Personnel)
            .all()
        )

        total_personnel = len(personnel_records)


        # -------------------------------------------------
        # Latest prediction for each personnel
        # -------------------------------------------------

        latest_predictions = []

        for person in personnel_records:

            latest = (
                db.query(RiskPrediction)
                .filter(
                    RiskPrediction.personnel_id
                    == person.personnel_id
                )
                .order_by(
                    RiskPrediction.id.desc()
                )
                .first()
            )

            if latest is not None:
                latest_predictions.append(latest)


        # -------------------------------------------------
        # Current risk counts
        # -------------------------------------------------

        high_risk = sum(
            1
            for prediction in latest_predictions
            if prediction.risk_level == "HIGH"
        )

        moderate_risk = sum(
            1
            for prediction in latest_predictions
            if prediction.risk_level == "MODERATE"
        )

        low_risk = sum(
            1
            for prediction in latest_predictions
            if prediction.risk_level == "LOW"
        )


        # -------------------------------------------------
        # Current assessment for each personnel
        # -------------------------------------------------

        recent_predictions = []

        for prediction in latest_predictions:

            recent_predictions.append({

                "personnel_id":
                    prediction.personnel_id,

                "risk_score":
                    float(prediction.risk_score),

                "risk_level":
                    prediction.risk_level,

                "created_at":
                    prediction.created_at
            })


        # -------------------------------------------------
        # Sort latest assessments by newest first
        # -------------------------------------------------

        recent_predictions.sort(
            key=lambda item: item["created_at"]
            if item["created_at"] is not None
            else datetime.min,
            reverse=True
        )


        return {

            "total_personnel":
                total_personnel,

            "high_risk":
                high_risk,

            "moderate_risk":
                moderate_risk,

            "low_risk":
                low_risk,

            "recent_predictions":
                recent_predictions
        }

    finally:

        db.close()

# =========================================================
# CREATE AUDIT LOG
# =========================================================

@app.post("/audit-log")
def create_audit_log(
    user_role: str,
    action: str,
    personnel_id: str = None
):

    db = SessionLocal()

    try:

        log = AuditLog(
            user_role=user_role,
            action=action,
            personnel_id=personnel_id,
            created_at=datetime.now()
        )

        db.add(log)

        db.commit()

        db.refresh(log)

        return {
            "message": "Audit log created successfully",
            "log_id": log.id
        }

    finally:

        db.close()

# =========================================================
# GET AUDIT LOGS
# =========================================================

@app.get("/audit-logs")
def get_audit_logs():

    db = SessionLocal()

    try:

        logs = (
            db.query(AuditLog)
            .order_by(
                AuditLog.id.desc()
            )
            .all()
        )

        result = []

        for log in logs:

            result.append({
                "log_id": log.id,
                "user_role": log.user_role,
                "action": log.action,
                "personnel_id": log.personnel_id,
                "created_at": log.created_at
            })

        return result

    finally:

        db.close()