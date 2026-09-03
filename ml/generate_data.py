import os
import numpy as np
import pandas as pd


def generate_dataset(number_of_personnel=2000):
    np.random.seed(42)

    data = []

    for i in range(1, number_of_personnel + 1):

        age = np.random.randint(21, 51)

        deployment_days = np.random.randint(0, 181)

        duty_hours = np.random.normal(9, 2)
        duty_hours = np.clip(duty_hours, 5, 16)

        night_duties = np.random.randint(0, 16)

        leave_days = np.random.randint(0, 31)

        days_since_leave = np.random.randint(1, 121)

        transfer_frequency = np.random.randint(0, 5)

        training_days = np.random.randint(0, 21)

        workload_last_7_days = np.random.uniform(20, 100)

        workload_last_30_days = np.random.uniform(20, 100)

        sleep_hours = np.random.normal(7, 1.2)
        sleep_hours = np.clip(sleep_hours, 3.5, 9)

        wellness_score = np.random.uniform(20, 95)

        self_reported_stress = np.random.uniform(10, 95)

        # ------------------------------------------------
        # Simulated stress-risk formula
        # ------------------------------------------------

        stress_index = (
            0.20 * deployment_days / 180 * 100
            + 0.20 * duty_hours / 16 * 100
            + 0.10 * night_duties / 15 * 100
            + 0.10 * days_since_leave / 120 * 100
            + 0.10 * transfer_frequency / 4 * 100
            + 0.08 * training_days / 20 * 100
            + 0.08 * workload_last_7_days
            + 0.05 * workload_last_30_days
            + 0.15 * self_reported_stress
            - 0.12 * wellness_score
            - 0.15 * sleep_hours
        )

        # Add randomness so the model does not learn
        # a perfectly deterministic formula.

        stress_index += np.random.normal(0, 8)

        stress_risk = 1 if stress_index > 45 else 0

        data.append([
            i,
            age,
            deployment_days,
            round(duty_hours, 2),
            night_duties,
            leave_days,
            days_since_leave,
            transfer_frequency,
            training_days,
            round(workload_last_7_days, 2),
            round(workload_last_30_days, 2),
            round(sleep_hours, 2),
            round(wellness_score, 2),
            round(self_reported_stress, 2),
            stress_risk
        ])

    columns = [
        "personnel_id",
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
        "self_reported_stress",
        "stress_risk"
    ]

    df = pd.DataFrame(data, columns=columns)

    os.makedirs("../data", exist_ok=True)

    output_path = "../data/personnel_wellness.csv"

    df.to_csv(output_path, index=False)

    print("Dataset generated successfully!")
    print(f"Saved to: {output_path}")
    print(f"Number of records: {len(df)}")
    print("\nFirst 5 records:")
    print(df.head())


if __name__ == "__main__":
    generate_dataset()