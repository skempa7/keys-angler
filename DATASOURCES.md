# Keys Angler — verified data sources

Verified live **2026-06-14**. Home port: Tavernier, FL (25.0033 N, −80.53 W), Monroe County.
All sources below are **free**; everything except FWC regs and NDBC is **keyless + CORS-open**,
so the browser-only PWA fetches them directly with **no backend**. Re-verify before each season.

---

## 1. Tides & currents — NOAA CO-OPS `datagetter` ✅ keyless, CORS `*`
Base: `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter`

- **Tide stations near Tavernier are all SUBORDINATE** → only `interval=hilo` works. Sending
  `interval=6`/`h` returns a misleading "datum" error. `datum=MLLW` is **mandatory**.
- Default tide station **8723748 Tavernier Creek (Hwy 1)** (at home port) / **8723747 Tavernier Harbor** (1.1 mi).
- **Currents**: nearest is **ACT8221 Long Key drawbridge (~20 mi SW)** — surface the distance caveat.
  Currents JSON differs: `current_predictions.cp[]` with `Type/Time/Velocity_Major` (parser branches by product).
- Hi/lo allowed up to **10 years ahead** (great for trip planning); currents ~1 yr ahead.
- Always pass `application=keys_angler`, `time_zone=lst_ldt`, `units=english`, `format=json`.
- Live observed water level only at **Vaca Key 8723970 (~43 mi)** — informational, never trust offshore.

Example: `…/datagetter?product=predictions&application=keys_angler&begin_date=20260614&end_date=20260616&datum=MLLW&station=8723748&time_zone=lst_ldt&units=english&interval=hilo&format=json`

## 2. Marine weather — Open-Meteo ✅ keyless, CORS `*`
- Marine: `https://marine-api.open-meteo.com/v1/marine` — waves, swell, sea-surface temp.
- Forecast: `https://api.open-meteo.com/v1/forecast` — wind speed/gusts/dir, pressure, weather code.
- Use `latitude=25.0&longitude=-80.5` (**longitude MUST be negative**), `cell_selection=sea`,
  `length_unit=imperial`, `wind_speed_unit=kn`, `temperature_unit=fahrenheit`, `timezone=America/New_York`.
- Up to `forecast_days=16` + `past_days` (pressure trend). ~600/min, 10k/day keyless.
- ⚠️ Keyless tier is **non-commercial**; ~8 km grid is planning-grade, **not** nav-safety. Keep NWS as authoritative.

## 3. Sun & moon — `astronomy-engine` (npm, MIT) ✅ bundled, offline
- The ONLY lib that computes the Moon's **upper transit** (solunar MAJOR / overhead) and
  **lower transit / anti-transit** (MAJOR / underfoot). suncalc cannot — rejected.
- `SearchHourAngle(Body.Moon, obs, 0|12, …)` transits; `SearchRiseSet` rise/set; `MoonPhase`/`Illumination`.
- Validated to the minute against USNO at Tavernier. ~45 KB gz, runs 100% on-device — perfect offshore.
- Optional online verify only: USNO `aa.usno.navy.mil/api/rstt/oneday` (CORS `*`).

## 4. Marine forecast & warnings — NWS `api.weather.gov` ✅ keyless, CORS `*`
- Marine zones (Tavernier): **GMZ031** Florida Bay · **GMZ042** Hawk Channel · **GMZ052** offshore→20NM · **GMZ072** 20–60NM.
- Forecast text = Coastal Waters Forecast product: `…/products/types/CWF/locations/KEY` → GET product `.productText`
  (marine zones have **no** structured `/forecast` JSON — it's text).
- Alerts (SCA / marine warnings): `…/alerts/active?zone=GMZ031,GMZ042,GMZ052,GMZ072` (GeoJSON).
- Conditions: `…/stations/LONF1/observations/latest` (Long Key, nearest live; fallback VCAF1, SMKF1).
  This **re-serves the C-MAN buoys with CORS**, sidestepping NDBC.
- ⚠️ **NDBC (ndbc.noaa.gov) has NO CORS** — never fetch directly. Browsers can't set User-Agent (works today anyway).
  Obs are SI units → convert to kn/°F/inHg client-side. MLRF1 (Molasses Reef) currently offline — probe, don't hardcode.

## 5. Regulations — FWC `myfwc.com` ❌ no API, NO CORS → curated seed
- Ship a **versioned JSON seed bundled in the app**, hydrated to IndexedDB, every field editable,
  each record stamped `lastVerified` + `sourceUrl` + a "Verify with FWC" deep link. Never fetch from browser.
- Compute lobster mini-season in code from "last consecutive Wed/Thu of July" (2026 = **Jul 29–30**).
- High-churn fields (grouper/snook/permit-SPZ/hogfish seasons) → manual re-verify each Dec & May 1.
- Verified 2026 values are encoded in `src/data/regs.js` (finfish) and `src/data/harvest.js` (crab/lobster/shrimp).

## 6. Habitat & depth — FWC Unified Reef Map v2.2 + NOAA NCEI CRM ✅ keyless, CORS
- Habitat (bottom type): `https://gis.myfwc.com/hosting/rest/services/Projects_FWC/UnifiedReefMapProject_v2_2/MapServer/10/query`
  — fields are prefixed `FIRST_ClassLv0..4`. Don't set `credentials:'include'` (reflects origin + allows credentials).
- Depth: `https://gis.ngdc.noaa.gov/arcgis/rest/services/DEM_mosaics/CRM_mosaic/ImageServer/identify` (~90 m grid, band-screening only).
- Strategy: **seed-on-WiFi** (cache habitat GeoJSON + coarse depth grid for the Keys home range) + **user-marked spots**.
  Trap productivity is hyper-local — habitat/depth screens & explains spots, the angler's own marks rank them.
- Offline basemap tiles: NOAA Chart Display Service (NCDS) MBTiles or OpenSeaMap seamarks (CORS `*`).
