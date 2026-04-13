from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later restrict to your Netlify domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input model: 30 features + optional label
class InputModel(BaseModel):
    data: list[float]   # must be exactly 30 floats
    expected_label: int | None = None

@app.get("/")
def home():
    return {"message": "API Running"}

@app.post("/predict")
def predict(input: InputModel):
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
