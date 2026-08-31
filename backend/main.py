import os
import sys
import json

# Ensure backend directory is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from engine.risk_engine import RiskEngine
from engine.gis_engine import GISEngine
from engine.decision_engine import DecisionEngine
from engine.routing_engine import RoutingEngine
from engine.reports_engine import ReportsEngine
from services.notification import MockNotificationService

app = FastAPI(
    title="LANDSAFE — From Warning to Action API",
    description="AI-Based Early Warning, Landslide Risk Monitoring, and Decision Support Engine for Arunachal Pradesh (SIH26001)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Engines
risk_engine = RiskEngine()
gis_engine = GISEngine()
decision_engine = DecisionEngine()
routing_engine = RoutingEngine()
reports_engine = ReportsEngine()
notification_service = MockNotificationService()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
METRICS_PATH = os.path.join(BASE_DIR, "models", "model_metrics.json")
GSI_GEOJSON_PATH = os.path.join(BASE_DIR, "data", "processed", "gsi_landslides", "arunachal_pradesh_landslides.geojson")

# Request Models
class PointRiskRequest(BaseModel):
    latitude: float = Field(..., example=28.1633)
    longitude: float = Field(..., example=95.4598)
    date: Optional[str] = Field("2024-07-15", example="2024-07-15")

class ExposureRequest(BaseModel):
    latitude: float = Field(..., example=28.1633)
    longitude: float = Field(..., example=95.4598)
    risk_score: int = Field(87, example=87)
    buffer_radius_km: Optional[float] = 3.5

class DecisionRequest(BaseModel):
    latitude: float = Field(..., example=28.1633)
    longitude: float = Field(..., example=95.4598)
    risk_score: int = Field(87, example=87)
    risk_level: str = Field("CRITICAL", example="CRITICAL")
    buffer_radius_km: Optional[float] = 3.5

class SubscriberRegisterRequest(BaseModel):
    name: str = Field(..., example="Rahul Sharma")
    phone: str = Field(..., example="+91 98765 43210")
    village: str = Field(..., example="Dambuk")
    language: str = Field("Hindi", example="Hindi")
    channel: str = Field("SMS", example="SMS")

class AlertDispatchRequest(BaseModel):
    location: str = Field(..., example="Dambuk")
    risk_score: int = Field(87, example=87)
    risk_level: str = Field("CRITICAL", example="CRITICAL")
    safe_shelter: Optional[str] = "Dambuk Higher Secondary School"

class CitizenReportRequest(BaseModel):
    citizen_name: str
    phone: str
    village: str
    location_desc: str
    latitude: float
    longitude: float
    indicators: List[str]
    severity: str = "HIGH"

# API Endpoints

@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "system": "LANDSAFE Decision-Support System",
        "pilot_region": "Arunachal Pradesh (Siang & Dibang River Corridors)",
        "model_loaded": risk_engine.explainer.model is not None
    }

@app.get("/api/metrics")
def get_model_metrics():
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, "r") as f:
            return json.load(f)
    return {"status": "Metrics not found"}

@app.get("/api/gis/layers")
def get_gis_layers():
    return gis_engine.get_all_gis_layers()

@app.get("/api/gis/landslides")
def get_gsi_landslides():
    if os.path.exists(GSI_GEOJSON_PATH):
        with open(GSI_GEOJSON_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"type": "FeatureCollection", "features": []}

@app.get("/api/risk/grid")
def get_risk_grid(date: str = "2024-07-15", res: int = 30):
    grid = risk_engine.generate_pilot_risk_grid(date_str=date, grid_res=res)
    return {
        "date": date,
        "total_grid_points": len(grid),
        "pilot_bounds": risk_engine.pilot_bounds,
        "grid_points": grid
    }

@app.post("/api/risk/point")
def evaluate_point_risk(req: PointRiskRequest):
    return risk_engine.evaluate_point_risk(lat=req.latitude, lon=req.longitude, date_str=req.date)

@app.post("/api/exposure/analyze")
def analyze_exposure(req: ExposureRequest):
    return gis_engine.analyze_exposure(
        center_lat=req.latitude,
        center_lon=req.longitude,
        risk_score=req.risk_score,
        buffer_radius_km=req.buffer_radius_km
    )

@app.post("/api/decisions/generate")
def generate_decisions(req: DecisionRequest):
    exposure = gis_engine.analyze_exposure(
        center_lat=req.latitude,
        center_lon=req.longitude,
        risk_score=req.risk_score,
        buffer_radius_km=req.buffer_radius_km
    )
    decisions = decision_engine.generate_recommendations(
        exposure_data=exposure,
        risk_level=req.risk_level,
        risk_score=req.risk_score
    )
    return {
        "exposure": exposure,
        "decisions": decisions
    }

@app.get("/api/alerts/subscribers")
def get_subscribers():
    return {"subscribers": notification_service.get_subscribers()}

@app.post("/api/alerts/register")
def register_subscriber(req: SubscriberRegisterRequest):
    sub = notification_service.register_subscriber(
        name=req.name,
        phone=req.phone,
        village=req.village,
        language=req.language,
        channel=req.channel
    )
    return {"status": "SUCCESS", "subscriber": sub}

@app.post("/api/alerts/dispatch")
def dispatch_alerts(req: AlertDispatchRequest):
    result = notification_service.simulate_targeted_dispatch(
        location=req.location,
        risk_score=req.risk_score,
        risk_level=req.risk_level,
        safe_shelter=req.safe_shelter
    )
    return result

@app.get("/api/alerts/history")
def get_alert_history():
    return {"history": notification_service.get_dispatch_history()}

@app.get("/api/routing/options")
def get_route_options():
    return {"routes": routing_engine.get_route_options()}

@app.get("/api/routing/evaluate/{route_key}")
def evaluate_route(route_key: str):
    return routing_engine.evaluate_route(route_key)

@app.get("/api/reports")
def get_reports():
    return {"reports": reports_engine.get_all_reports()}

@app.post("/api/reports/submit")
def submit_report(req: CitizenReportRequest):
    rep = reports_engine.submit_report(
        citizen_name=req.citizen_name,
        phone=req.phone,
        village=req.village,
        location_desc=req.location_desc,
        lat=req.latitude,
        lon=req.longitude,
        indicators=req.indicators,
        severity=req.severity
    )
    return {"status": "SUCCESS", "report": rep}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
