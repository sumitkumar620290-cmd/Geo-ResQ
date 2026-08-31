# GEORESQ — DEVELOPMENT READINESS REPORT
## FROM WARNING TO ACTION (SIH26001)

**System Name:** GEORESQ  
**Problem Statement:** SIH26001 — AI-Based Early Warning and Landslide Risk Monitoring System in NER  
**Pilot Study Region:** Arunachal Pradesh (Siang & Lower Dibang Valley Corridors)  
**Report Date:** August 31, 2026  
**Architectural Core:** PREDICT $\rightarrow$ EXPLAIN $\rightarrow$ LOCATE $\rightarrow$ PRIORITIZE $\rightarrow$ ACT  

---

## 1. Current Project Structure

```
GeoResQ/
├── backend/
│   ├── engine/
│   │   ├── risk_engine.py         # 30m in-memory raster sampler & dynamic risk inference
│   │   ├── gis_engine.py          # Spatial settlement, road & infrastructure exposure analysis
│   │   ├── decision_engine.py     # System recommendation generator (P1/P2/P3 actions)
│   │   ├── routing_engine.py      # Landslide-aware lower-risk alternative path calculator
│   │   └── reports_engine.py      # Citizen crowd-sourced ground observation queue
│   ├── services/
│   │   └── notification.py        # Multi-lingual mock alert simulator & dispatch audit log
│   └── main.py                    # FastAPI application with CORS and 14 validated endpoints
│
├── data/
│   ├── raw/                       # [READ-ONLY SOURCE OF TRUTH]
│   │   ├── landslide_report.pdf   # 904-page GSI national landslide compendium
│   │   ├── N28E095.SRTMGL1.hgt.zip# 30m NASA SRTM elevation tile
│   │   ├── out*.tif               # 7 ISRIC SoilGrids physical property GeoTIFFs
│   │   └── RF25_ind*.nc           # 26 IMD daily gridded rainfall NetCDF files (2000–2025)
│   └── processed/
│       ├── gsi_landslides/        # Cleaned CSV & GeoJSON of 1,180 Arunachal Pradesh slides
│       ├── terrain/               # 30m Elevation, Slope (°), and Aspect (azimuth) GeoTIFFs
│       ├── soil/                  # Standardized physical soil property rasters
│       └── landslide_training_dataset.csv # 474-row spatial training dataset (5 spatial folds)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # GEORESQ global navigation with status badges & triggers
│   │   │   ├── GisRiskMap.jsx     # Leaflet vector GIS map with layer controls & popups
│   │   │   ├── AuthorityDashboard.jsx # Commander dashboard, point inspector & action dispatch
│   │   │   ├── CitizenMode.jsx    # Plain-language risk portal with 4-language switcher
│   │   │   ├── EmergencyMode.jsx  # Red high-urgency disaster operations layout
│   │   │   ├── AlertCenter.jsx    # Subscriber intake, dispatch simulation & SMS preview
│   │   │   ├── SafeRouteNavigator.jsx # Comparative lower-risk transit evaluator
│   │   │   ├── CitizenReportsPortal.jsx # Field hazard submission & engineering triage queue
│   │   │   └── ModelMetricsModal.jsx # Real Spatial Cross-Validation benchmark viewer
│   │   ├── App.jsx                # Main application state & API connector
│   │   └── index.css              # Tailwind CSS v4 + Dark Glassmorphism tokens
│   ├── vite.config.js             # Vite + Tailwind v4 + Proxy configuration
│   └── package.json               # React, Lucide Icons, Leaflet, Tailwind dependencies
│
├── ml/
│   ├── train.py                   # 5-Fold Spatial Cross-Validation ML benchmarking script
│   └── explain.py                 # Geotechnical physical factor attribution explainer
│
├── models/
│   ├── landsafe_risk_model.joblib # Production-selected Random Forest model artifact
│   └── model_metrics.json         # Real empirical spatial cross-validation metrics
│
├── pipeline/                      # Reproducible data ingestion & processing scripts
│   ├── extract_gsi.py             # 904-page PDF tabular extraction pipeline
│   ├── process_terrain.py         # Horn/Sobel derivative slope & aspect processor
│   ├── process_soil.py            # SoilGrids SI unit scaler
│   ├── extract_rainfall.py        # IMD 26-year NetCDF rolling rainfall query engine
│   └── build_dataset.py           # Pseudo-absence generation & spatial fold partitioner
│
├── DATA_AUDIT_REPORT.md           # Comprehensive empirical audit of all 35 raw data files
└── walkthrough.md                 # System verification & live walkthrough documentation
```

---

## 2. Actual Datasets Available

| Dataset Source | Format & Coverage | Resolution / Span | Variables Extracted | Role in GEORESQ |
|---|---|---|---|---|
| **GSI Landslides** | PDF (`landslide_report.pdf`, 904 pages) | 35,730 total / 1,180 in AP | Coordinates, Location, Movement Type, Material | Ground-truth historical landslide occurrence ($Y=1$) |
| **NASA SRTM DEM** | 1-arcsec HGT (`N28E095.hgt`) | ~30m spatial / $1^\circ \times 1^\circ$ tile | Elevation ($114\text{m} - 4440\text{m}$), Slope ($0^\circ - 86.7^\circ$), Aspect | Core static topographic hazard drivers |
| **ISRIC SoilGrids** | 7 GeoTIFFs (`out.tif` – `out (6).tif`) | ~250m spatial / $2^\circ \times 2^\circ$ tile | Clay, Sand, Silt, Bulk Density, SOC, pH, N | Static geotechnical soil texture & shearing constraints |
| **IMD Rainfall** | 26 NetCDF files (`2000–2025`) | 0.25° gridded / 9,497 daily steps | $1\text{d}, 3\text{d}, 7\text{d}, 30\text{d}$ antecedent cumulative rainfall | Dynamic precipitation triggering threshold |

---

## 3. Data Quality & Limitations

1. **GSI Timestamps:** 86.8% of GSI records in Arunachal Pradesh have missing or `NA` event dates. Therefore, spatial landslide susceptibility mapping was established with static environmental features plus regional extreme monsoon rainfall baselines.
2. **Presence-Only Bias:** The raw GSI dataset contains exclusively positive landslide records. Rigorous pseudo-absences were systematically generated with $\ge 500\text{m}$ buffer distance from positive points on stable low-to-moderate slope terrains.
3. **Soil Properties vs. Soil Moisture:** ISRIC SoilGrids measures static physical texture (clay, sand, silt, organic carbon, bulk density) and is **never** misrepresented as live soil moisture.

---

## 4. Machine Learning & Spatial Cross-Validation Strategy

Standard random train/test splits severely overestimate accuracy on geospatial landslide data due to spatial autocorrelation. We implemented **5-Fold Spatial Blocking** along longitudinal slices across Arunachal Pradesh:

| Model Candidate | Spatial ROC-AUC | Precision | Recall | F1-Score | Brier Score | Decision |
|---|---|---|---|---|---|---|
| **Random Forest** | **0.8249** | **82.25%** | **58.65%** | **0.6847** | **0.1808** | **SELECTED FOR PRODUCTION** |
| Gradient Boosting | 0.7635 | 82.17% | 54.43% | 0.6548 | 0.2386 | Baseline Benchmark |
| Logistic Regression | 0.7497 | 76.35% | 65.40% | 0.7045 | 0.2121 | Baseline Benchmark |

**Top 5 Physical Feature Importances:**
1. Elevation ($22.0\%$)
2. Slope ($12.8\%$)
3. 30-Day Cumulative Rainfall ($12.6\%$)
4. Bulk Density ($10.8\%$)
5. Soil Organic Carbon ($7.8\%$)

---

## 5. GIS Exposure & Priority Decision Engine

GEORESQ translates raw risk scores into actionable decisions:

$$\text{Risk Score } (0-100) + \text{GIS Exposure Buffer } (3.5\text{km}) \Longrightarrow \textbf{System Recommendations}$$

- **High/Critical Risk + Settlement:** "Initiate pre-evacuation alert toward designated concrete safe shelter (e.g. Dambuk Higher Secondary School)."
- **High/Critical Risk + Road Corridor:** "Suspend vehicular traffic on NH-13 (MP 48–52); divert transit to low-gradient Siluk valley bypass."
- **Critical Risk + Bridge/Culvert:** "Deploy PWD/BRO structural engineers for immediate bridge abutment inspection."

---

## 6. Zero-Paid-API Notification Simulation Architecture

- **MockNotificationService:** Multi-lingual notification generation in **English, Hindi, Assamese, and Bengali**.
- **Delivery Status Clarity:**
  - SMS: `SIMULATED / DISPATCH RECORDED`
  - WhatsApp: `NOT CONFIGURED (FUTURE API)`
- **Subscriber Matching:** Matches registered citizens to their specific village sector, ensuring targeted warning dispatches without spamming unrelated areas.

---

## 7. Operational Readiness Status

- [x] **Backend API:** Running on `http://127.0.0.1:8000` (FastAPI with sub-50ms inference).
- [x] **Frontend Web App:** Running on `http://127.0.0.1:5173` (React + Tailwind v4 + Leaflet).
- [x] **Branding Compliance:** Verified strict and uniform use of **GEORESQ**.
- [x] **Scientific Integrity Compliance:** All model metrics are derived from spatial cross-validation; all advice is labeled as **System Recommendations**.
