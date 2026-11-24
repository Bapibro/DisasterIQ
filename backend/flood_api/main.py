from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

from .risk import assess_rainfall

app = FastAPI(
    title="DisasterIQ Flood Prediction API",
    description="Preliminary rainfall-based screening; no trained flood model is currently available.",
    version="1.0.0",
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "DISASTERIQ_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    current_rain_mm: float | None = Field(default=None, ge=0)
    observed_24h_rain_mm: float | None = Field(default=None, ge=0)
    forecast_24h_rain_mm: float | None = Field(default=None, ge=0)
    elevation_m: float | None = Field(default=None, ge=-500)


class PredictionResponse(BaseModel):
    risk_category: Literal["Low", "Moderate", "High", "Severe", "Unavailable"]
    status: Literal["preliminary"]
    model_status: Literal["not_trained"]
    evaluation_metrics: None
    prediction_window: str
    basis: str
    factors: list[str]
    generated_at: str


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "model_status": "not_trained"}


@app.post("/prediction", response_model=PredictionResponse)
def predict(request: PredictionRequest) -> PredictionResponse:
    result = assess_rainfall(
        current_rain_mm=request.current_rain_mm,
        observed_24h_rain_mm=request.observed_24h_rain_mm,
        forecast_24h_rain_mm=request.forecast_24h_rain_mm,
        elevation_m=request.elevation_m,
    )
    return PredictionResponse(
        **result,
        status="preliminary",
        model_status="not_trained",
        evaluation_metrics=None,
        prediction_window="Current model time through the next 24 hours",
        generated_at=datetime.now(timezone.utc).isoformat(),
    )
