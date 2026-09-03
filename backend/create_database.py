from backend.database import engine, Base
from backend.models import Personnel, RiskPrediction, WellnessCheckin


print("Creating database tables...")

Base.metadata.create_all(bind=engine)

print("Database tables are ready!")
print("Tables:")
print("- personnel")
print("- risk_predictions")
print("- wellness_checkins")