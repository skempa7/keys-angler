# Keys Angler 🎣

An advanced, **offline-first** fishing & trapping PWA for the Upper Florida Keys
(home port: Tavernier). Built to teach an expert something — every recommendation
shows its reasoning.

**Live:** https://skempa7.github.io/keys-angler/ · Install to your iPhone home screen from Safari → Share → *Add to Home Screen*.

## What it does

- **Should I go?** — a single 0–100 conditions score with a plain-language verdict,
  broken into weighted, tappable factors (solunar, tide, wind/sea, water temp, moon,
  barometric trend). Transparent scoring, no black box.
- **Bite times** — solunar majors/minors (moon over/underfoot, moonrise/set) overlaid
  on the tide, merged into ranked daily windows with the reasoning behind each.
- **Trip planner** — plan a future date + zone; it caches tides, forecast, bite windows,
  warnings & regs so the full briefing works offline on the water. Return-by-sunset,
  float-plan share, calendar (.ics) export, and print.
- **Target a species** — pick what you want to catch → zone, depth, water-temp fit vs.
  today, rig/leader, baits/lures, technique, best tide/time, and a captain's pro tip;
  filtered to your gear.
- **Is it legal to keep this?** — pick a species + size → keep/release with the FWC rule cited.
- **Stone crab / spiny lobster / shrimp** — season status + countdowns, rules, mini-season,
  trap-placement habitat guidance, and your own ranked spots.
- **Catch log** — private, on-device; auto-tags moon phase + solunar period and surfaces
  *your* patterns over time.
- **Grand Slam tracker** — tarpon + bonefish + permit in a day, scored from your log.
- **Gear & boat locker** — your tackle & vessel; recommendations filter to what you own.

## Stack

React + Vite · `vite-plugin-pwa` (Workbox) · Dexie (IndexedDB) · `astronomy-engine`.
No backend — all data is fetched directly in the browser and mirrored to IndexedDB.

## Data sources (all free)

| Source | Used for | Notes |
| --- | --- | --- |
| NOAA CO-OPS | Tides & currents | keyless + CORS; Keys stations are hi/lo only |
| Open-Meteo | Waves, wind, water temp, pressure | keyless + CORS; planning-grade |
| api.weather.gov (NWS) | Marine forecast & warnings, buoy obs | keyless + CORS |
| astronomy-engine | Sun/moon, lunar transit | bundled, computed on-device (offline) |
| FWC | Regulations | curated seed (no API/CORS); see `src/data/regs.js`, `harvest.js` |
| FWC Reef Map + NOAA NCEI | Habitat/depth | seed-on-WiFi (planned overlay) |

Details + verified endpoints: [`DATASOURCES.md`](./DATASOURCES.md).

> ⚠️ Planning aid only. Always verify the live NWS marine forecast before leaving the
> dock, and confirm size/bag/season with FWC before you harvest. Regs are dated and editable.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173/
npm run build    # production build → dist/
```

Deploys to GitHub Pages automatically via `.github/workflows/deploy.yml` on push to `main`.
