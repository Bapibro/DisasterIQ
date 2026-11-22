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
