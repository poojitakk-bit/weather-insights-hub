import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report


# Load dataset
df = pd.read_csv("flood_risk_dataset_india.csv")

print("Dataset loaded!")
print("Rows:", len(df))
print("Columns:", list(df.columns))


# Target
X = df.drop("Flood Occurred", axis=1)
y = df["Flood Occurred"]


# Categorical columns
categorical_features = [
    "Land Cover",
    "Soil Type"
]


# Numerical columns
numerical_features = [
    "Latitude",
    "Longitude",
    "Rainfall (mm)",
    "Temperature (°C)",
    "Humidity (%)",
    "River Discharge (m³/s)",
    "Water Level (m)",
    "Elevation (m)",
    "Population Density",
    "Infrastructure",
    "Historical Floods"
]


# Preprocessing
preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(handle_unknown="ignore"),
            categorical_features
        ),
        (
            "numerical",
            "passthrough",
            numerical_features
        )
    ]
)


# Random Forest
model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    class_weight="balanced"
)


# Pipeline
pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("model", model)
    ]
)


# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


# Train
print("\nTraining Random Forest...")
pipeline.fit(X_train, y_train)

print("Training complete!")


# Test
predictions = pipeline.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print("\n==============================")
print("MODEL ACCURACY:", accuracy)
print("==============================")

print("\nClassification Report:")
print(classification_report(y_test, predictions))


# Save model
joblib.dump(pipeline, "flood_model.pkl")

print("\n================================")
print("MODEL SAVED: flood_model.pkl")
print("================================")