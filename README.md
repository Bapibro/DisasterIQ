# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Nagpur Live Monitoring

The `/live-monitoring` page provides a Nagpur-centered interactive map, OpenStreetMap locality search, RainViewer past radar frames, and Open-Meteo model weather and hourly precipitation forecasts. Radar metadata refreshes every five minutes; forecast data refreshes hourly. Both feeds show their own update timestamps and retain the last successful response if a refresh fails.

RainViewer currently provides past frames only (no nowcast), and its radar tiles have a maximum native zoom of 7. IMD warning/nowcast/rainfall layers, a Nagpur city boundary, flood susceptibility, and verified waterlogging reports are not drawn because no browser-accessible, verified local data feed is available. The dashboard is situational awareness, not an official warning system.

## Nagpur Flood Prediction

The `/flood-prediction` page shows Open-Meteo forecast and past-hour model rainfall, the previous seven complete days from the Open-Meteo Historical Weather API, and point elevation from the Open-Meteo Elevation API (Copernicus GLO-90, approximately 90 m). Times are displayed in Asia/Kolkata; each feed shows its retrieval or model timestamp. Historical model rainfall is not an IMD gauge observation.

This repository does not contain a verified, geocoded Nagpur flood/waterlogging label dataset or a local susceptibility layer. IMD rainfall information and NRSC Bhuvan thematic services are linked for investigation, but their layers are not presented as integrated flood labels. The map only assesses a user-selected point; it does not draw invented incidents or affected localities.

The FastAPI backend returns a preliminary rainfall screening category, not a calibrated flood probability or official warning. Its 24-hour rainfall bands align with IMD daily rainfall class boundaries (15.6, 64.5, and 115.6 mm); terrain is shown as context but does not adjust the category. No ML model has been trained and no evaluation metrics are claimed. `backend/flood_api/training.py` contains a Random Forest pipeline for a future verified, event-labelled dataset and evaluates on a held-out event split.

### Run the flood API locally (Windows PowerShell)

From `backend`:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn flood_api.main:app --reload --port 8000
```

In another terminal, run the React app from the repository root with `npm run dev`. Vite proxies `/api` to `http://127.0.0.1:8000`; no API key is required. To use a separately hosted backend, set `VITE_FLOOD_API_URL` to its `/api` base URL and configure `DISASTERIQ_CORS_ORIGINS` on the backend to include the frontend origin.

Run backend checks from `backend` with `.\.venv\Scripts\python.exe -m unittest discover -s tests`. For eventual model training, use a CSV with `rain_1h_mm`, `rain_24h_mm`, `rain_forecast_24h_mm`, `elevation_m`, binary `flood_label` (0/1), and `event_id`; event IDs are held out together to avoid evaluating on the same recorded event used for training. Do not populate this schema with unverified or synthetic flood labels. Training reports precision, recall, F1, and a labelled confusion matrix only after a successful evaluation.
