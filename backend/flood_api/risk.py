from __future__ import annotations

from typing import Any


def assess_rainfall(
    *,
    current_rain_mm: float | None,
    observed_24h_rain_mm: float | None,
    forecast_24h_rain_mm: float | None,
    elevation_m: float | None,
) -> dict[str, Any]:
    available_windows = [
        value
        for value in (observed_24h_rain_mm, forecast_24h_rain_mm)
        if value is not None
    ]
    factors: list[str] = []

    if current_rain_mm is not None:
        factors.append(f"Current model precipitation: {current_rain_mm:.1f} mm.")
    if observed_24h_rain_mm is not None:
        factors.append(f"Modelled precipitation over the previous 24 hours: {observed_24h_rain_mm:.1f} mm.")
    if forecast_24h_rain_mm is not None:
        factors.append(f"Forecast precipitation over the next 24 hours: {forecast_24h_rain_mm:.1f} mm.")
    if elevation_m is not None:
        factors.append(
            f"Terrain elevation: {elevation_m:.0f} m (context only; not used to adjust risk without "
            "verified drainage and local flood labels)."
        )

    if not available_windows:
        return {
            "risk_category": "Unavailable",
            "basis": "A complete observed or forecast 24-hour rainfall total is unavailable.",
            "factors": factors,
        }

    highest_24h_rainfall = max(available_windows)
    if highest_24h_rainfall >= 115.6:
        category = "Severe"
    elif highest_24h_rainfall >= 64.5:
        category = "High"
    elif highest_24h_rainfall >= 15.6:
        category = "Moderate"
    else:
        category = "Low"

    factors.append(
        f"Highest available 24-hour rainfall total: {highest_24h_rainfall:.1f} mm; "
        "the larger observed/forecast window determines the screening category."
    )
    return {
        "risk_category": category,
        "basis": (
            "Preliminary rainfall screening using India Meteorological Department daily-rainfall "
            "class boundaries; this is not a calibrated flood probability or official warning."
        ),
        "factors": factors,
    }
