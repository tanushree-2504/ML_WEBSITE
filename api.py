from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import pickle
import numpy as np
import os

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load your trained model ──────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

# ── Input schema ─────────────────────────────────────
class InputModel(BaseModel):
    data: list[float]        # exactly 30 floats
    expected_label: int | None = None

@app.get("/")
def home():
    return {"message": "TrustAware API is running"}

@app.post("/predict")
def predict(input: InputModel):
    # Convert to numpy array shape (1, 30)
    features = np.array(input.data).reshape(1, -1)

    # Get prediction
    prediction = int(model.predict(features)[0])

    # Get confidence (probability)
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(features)[0]
        confidence = float(round(max(proba) * 100, 2))
    else:
        confidence = 100.0  # SVM or models without proba

    # Reliability based on confidence
    if confidence >= 85:
        reliability = "High"
    elif confidence >= 65:
        reliability = "Medium"
    else:
        reliability = "Low"

    # Warning logic
    if input.expected_label is not None and prediction != input.expected_label:
        warning = "Prediction does not match expected label. Please review."
    elif confidence < 65:
        warning = "Low confidence — consider manual review."
    else:
        warning = ""

    return {
        "prediction": prediction,
        "confidence": confidence,
        "reliability": reliability,
        "warning": warning,
        "expected_label": input.expected_label
    }