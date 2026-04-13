from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS so Netlify frontend can connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # you can restrict to your Netlify domain later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input model for prediction
class InputModel(BaseModel):
    data: list[float]

@app.get("/")
def home():
    return {"message": "API Running"}

@app.post("/predict")
def predict(input: InputModel):
    # Replace this dummy logic with your ML model
    prediction = 1  # pretend benign
    confidence = 0.95
    reliability = "High"
    warning = "No issues"

    return {
        "prediction": prediction,
        "confidence": confidence,
        "reliability": reliability,
        "warning": warning
    }

