from sqlalchemy import Column, Integer, Float, String, DateTime, JSON

from backend.database import Base


class Personnel(Base):

    __tablename__ = "personnel"

    id = Column(Integer, primary_key=True, index=True)

    personnel_id = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    age = Column(Integer)

    unit = Column(String)

    deployment_days = Column(Integer)

    daily_duty_hours = Column(Float)

    night_duties = Column(Integer)

    leave_days = Column(Integer)

    days_since_last_leave = Column(Integer)

    transfer_frequency = Column(Integer)

    training_days = Column(Integer)

    workload_7_days = Column(Float)

    workload_30_days = Column(Float)

    sleep_hours = Column(Float)

    wellness_score = Column(Float)

    self_reported_stress = Column(Float)

class RiskPrediction(Base):

    __tablename__ = "risk_predictions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    personnel_id = Column(
        String,
        index=True,
        nullable=False
    )

    risk_score = Column(Float)

    risk_level = Column(String)

    top_factors = Column(JSON)

    recommendations = Column(JSON)

    created_at = Column(
        DateTime,
        nullable=False
    )
class WellnessCheckin(Base):

    __tablename__ = "wellness_checkins"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    personnel_id = Column(
        String,
        index=True,
        nullable=False
    )

    sleep_hours = Column(Float)

    stress_level = Column(Float)

    energy_level = Column(Float)

    wellness_score = Column(Float)

    workload_level = Column(String)

    created_at = Column(String)

class AuditLog(Base):

    __tablename__ = "audit_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_role = Column(
        String,
        nullable=False
    )

    action = Column(
        String,
        nullable=False
    )

    personnel_id = Column(
        String,
        nullable=True
    )

    created_at = Column(
        DateTime,
        nullable=False
    )