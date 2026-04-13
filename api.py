from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS so Netlify frontend can connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later restrict to your Netlify domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input model: 30 features + optional label
class InputModel(BaseModel):
    data: list[float]   # strictly the 30 features
    expected_label: int | None = None  # optional, if provided in CSV

@app.get("/")
def home():
    return {"message": "API Running"}

@app.post("/predict")
def predict(input: InputModel):
    # Example dummy logic: sum of features
    score = sum(input.data)

    prediction = 1 if score > 100 else 0
    confidence = 0.90
    reliability = "High" if confidence > 0.8 else "Medium"
    warning = "No issues"

    return {
        "prediction": prediction,
        "confidence": confidence,
        "reliability": reliability,
        "warning": warning,
        "expected_label": input.expected_label
    }
