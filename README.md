# GEORESQ — FROM WARNING TO ACTION

**SIH Problem Statement:** SIH26001 — AI-Based Early Warning and Landslide Risk Monitoring System in NER  
**Pilot Study Region:** Arunachal Pradesh, India (Siang & Lower Dibang Valley Corridors)  
**System Architecture:** PREDICT $\rightarrow$ EXPLAIN $\rightarrow$ LOCATE $\rightarrow$ PRIORITIZE $\rightarrow$ ACT  

---

## 1. Executive Summary

**GEORESQ** is a full-stack disaster-risk intelligence and decision-support command center designed for the mountainous terrain of the Northeast Region of India.

Rather than providing simple uncalibrated probabilities or static maps, GEORESQ addresses the complete disaster-management decision chain:

```
            ENVIRONMENTAL DATA (NASA SRTM, ISRIC SoilGrids, IMD Daily Rain, GSI History)
                                          ↓
                        ML RISK ENGINE (Calibrated Risk Score 0–100)
                                          ↓
               PHYSICAL EXPLAINABILITY (Slope, Saturated Shear Stress, Plasticity)
                                          ↓
             GIS EXPOSURE ENGINE (Settlements, NH-13/313, Bridges, Schools, Hospitals)
                                          ↓
               DECISION & ACTION ENGINE (Prioritized System Recommendations)
                                          ↓
             TARGETED ALERT SIMULATOR (English, Hindi, Assamese, Bengali)
                                          ↓
                     CITIZEN / DISASTER MANAGEMENT AUTHORITIES
```

---

## 2. Key Modules & Features

1. **Authority Dashboard:**
   - 5-metric regional summary (5,670 km² coverage, exposed population, active critical zones, monitored highways, designated safe shelters).
   - Interactive GIS vector hazard map with layer controls (Risk grid, Villages, Roads, Critical infrastructure, Historical GSI landslides).
   - Point Inspector displaying calibrated Risk Score (0–100) and explainable physical factors (topography, antecedent rainfall, soil texture).
   - Exposure analysis detailing affected population, schools, bridges, and highways.
   - Action Engine generating prioritized **System Recommendations** with 1-click dispatch to the Alert Center.

2. **Citizen Mode:**
   - Non-technical, high-clarity threat level indicators.
   - **4-Language Translation:** English, हिन्दी (Hindi), অসমীয়া (Assamese), and বাংলা (Bengali).
   - Clear *"Why is your area at risk?"* geotechnical summaries.
   - *"What You Should Do Immediately"* actionable checklists.
   - Designated concrete safe shelter location with navigation distance.

3. **Emergency Mode (CRITICAL PROTOCOL):**
   - High-urgency red operations layout.
   - Active pre-evacuation directives for vulnerable settlements (Dambuk, Aohali).
   - Road stoppage statuses on NH-13 & NH-313 with low-gradient valley bypass routes.
   - Real-time pre-positioned emergency asset tracking (NDRF, BRO heavy machinery, trauma units).
   - 1-Click Mass Citizen Broadcast Simulator.

4. **Targeted Disaster Alert Center:**
   - Citizen subscriber intake (Name, Phone, Village, Language, Channel).
   - Zero-Paid-API simulation matching engine.
   - Interactive **SMS Delivery Preview Modal** simulating mobile device reception with multi-lingual alerts and simulation status tags (`SIMULATED / DISPATCH RECORDED`, `NOT CONFIGURED` for future WhatsApp API).

5. **Landslide-Aware Safe Route Navigator:**
   - Evaluates road slope angles, recent rainfall, and historical failure zones.
   - Compares high-risk mountain highway segments (Score: 78/100) against lower-risk valley bypass corridors (Score: 24/100).

6. **Citizen Ground Hazard Reports Portal:**
   - Crowd-sourced reporting for early physical indicators (Ground cracking, fallen rocks, mudflow, road damage, water seepage).
   - Field reports triage and authority engineering verification queue.

7. **ML Validation & Model Transparency Modal:**
   - Displays real **5-Fold Spatial Cross-Validation** benchmark metrics (Random Forest ROC-AUC: **0.8249**, Precision: **82.25%**, Brier Score: **0.1808**).
   - Feature importance breakdown preventing spatial autocorrelation data leakage.

---

## 3. Running GEORESQ Locally

### 1. Backend Service (FastAPI)
```bash
# From workspace root
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
- API Health: `http://127.0.0.1:8000/api/health`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

### 2. Frontend Application (React + Vite + Tailwind CSS v4)
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
- Open browser at: `http://127.0.0.1:5173/`

---

## 4. Scientific Method & Integrity Compliance

- **No False Certainty:** GEORESQ outputs calibrated Risk Scores ($0–100$) reflecting relative geotechnical and meteorological susceptibility.
- **No Fabricated Data:** Trained exclusively on 35 raw datasets provided in the repository.
- **Disclaimer:** All system advice is explicitly designated as **GEORESQ System Recommendations** and must be validated alongside official government directives.
