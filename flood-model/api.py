from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd

app = FastAPI()

# Allow your frontend to communicate with the ML API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load trained Random Forest model
model = joblib.load("flood_model.pkl")


@app.get("/")
def home():
    return {
        "status": "Flood ML API running"
    }


@app.post("/predict")
def predict(data: dict):

    # Print incoming values so we can verify
    # that different map locations send different data.
    print("\n========== ML REQUEST ==========")

    print("Latitude:", data.get("Latitude"))
    print("Longitude:", data.get("Longitude"))
    print("Rainfall (mm):", data.get("Rainfall (mm)"))
    print("Temperature (°C):", data.get("Temperature (°C)"))
    print("Humidity (%):", data.get("Humidity (%)"))
    print("River Discharge (m³/s):", data.get("River Discharge (m³/s)"))
    print("Water Level (m):", data.get("Water Level (m)"))
    print("Elevation (m):", data.get("Elevation (m)"))
    print("Land Cover:", data.get("Land Cover"))
    print("Soil Type:", data.get("Soil Type"))
    print("Population Density:", data.get("Population Density"))
    print("Infrastructure:", data.get("Infrastructure"))
    print("Historical Floods:", data.get("Historical Floods"))

    print("================================\n")

    # Convert request into DataFrame
    input_data = pd.DataFrame([data])

    # Run Random Forest prediction
    prediction = model.predict(input_data)[0]

    # Get probability of flood = 1
    probability = model.predict_proba(input_data)[0][1]

    # Convert probability into risk category
    if probability >= 0.70:
        risk = "HIGH"
    elif probability >= 0.40:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    return {
        "flood": int(prediction),
        "probability": round(float(probability) * 100, 2),
        "risk_level": risk
    }