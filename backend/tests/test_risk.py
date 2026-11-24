import unittest

from flood_api.risk import assess_rainfall


class RainfallScreeningTests(unittest.TestCase):
    def assess(self, observed: float | None, forecast: float | None) -> str:
        result = assess_rainfall(
            current_rain_mm=0.0,
            observed_24h_rain_mm=observed,
            forecast_24h_rain_mm=forecast,
            elevation_m=310.0,
        )
        return result["risk_category"]

    def test_daily_rainfall_classes(self) -> None:
        cases = (
            (0.0, "Low"),
            (15.6, "Moderate"),
            (64.5, "High"),
            (115.6, "Severe"),
        )
        for rainfall, expected in cases:
            with self.subTest(rainfall=rainfall):
                self.assertEqual(self.assess(rainfall, None), expected)

    def test_uses_the_larger_observed_or_forecast_total(self) -> None:
        self.assertEqual(self.assess(4.0, 65.0), "High")

    def test_missing_rainfall_is_unavailable_not_low(self) -> None:
        self.assertEqual(self.assess(None, None), "Unavailable")


if __name__ == "__main__":
    unittest.main()
