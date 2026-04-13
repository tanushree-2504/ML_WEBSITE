from fastapi import FastAPI
from pydantic import BaseModel
import pickle
import numpy as np

model = pickle.load(open("model.pkl", "rb"))
scaler = pickle.load(open("scaler.pkl", "rb"))

app = FastAPI()

class InputData(BaseModel):
    data: list

@app.get("/")
def home():
    return {"message": "API Running"}

@app.post("/predict")
def predict(input_data: InputData):
    try:
        values = np.array(input_data.data).reshape(1, -1)
        values = scaler.transform(values)

        prediction = model.predict(values)[0]
        confidence = max(model.predict_proba(values)[0])

        if confidence > 0.85:
            reliability = "High"
        elif confidence > 0.65:
            reliability = "Medium"
        else:
            reliability = "Low"

        warning = "None"
        if reliability == "Low":
            warning = "⚠ Low confidence prediction"

        return {
            "prediction": int(prediction),
            "confidence": float(confidence),
            "reliability": reliability,
            "warning": warning
        }
    except Exception as e:
        return {"error": str(e)}

