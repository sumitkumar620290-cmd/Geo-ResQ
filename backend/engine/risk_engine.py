import os
import math
import json
import rasterio
import numpy as np
import pandas as pd
from typing import Dict, Any, List

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "models")
TERRAIN_DIR = os.path.join(BASE_DIR, "data", "processed", "terrain")
SOIL_DIR = os.path.join(BASE_DIR, "data", "processed", "soil")
PIPELINE_DIR = os.path.join(BASE_DIR, "pipeline")

import sys
sys.path.append(os.path.join(BASE_DIR, "ml"))
sys.path.append(PIPELINE_DIR)

from explain import RiskExplainer
from extract_rainfall import IMDRainfallExtractor

class RiskEngine:
    def __init__(self):
        self.explainer = RiskExplainer()
        self.rainfall_extractor = IMDRainfallExtractor()
        self.elev_path = os.path.join(TERRAIN_DIR, "elevation.tif")
        self.slope_path = os.path.join(TERRAIN_DIR, "slope.tif")
        self.aspect_path = os.path.join(TERRAIN_DIR, "aspect.tif")
        self.soil_props = ["clay", "sand", "silt", "bulk_density", "organic_carbon", "ph_h2o", "nitrogen"]
        self.soil_paths = {p: os.path.join(SOIL_DIR, f"{p}.tif") for p in self.soil_props}
        
        self.pilot_bounds = {
            "lat_min": 28.0000, "lat_max": 28.8401,
            "lon_min": 95.3828, "lon_max": 96.0000
        }
        
        self.raster_cache = {}
        self._preload_rasters()
        
        # Pre-compute pilot grid on initialization
        self.cached_grid = self._compute_pilot_grid(grid_res=25)

    def _preload_rasters(self):
        paths = {
            "elevation": self.elev_path,
            "slope": self.slope_path,
            "aspect": self.aspect_path,
            **self.soil_paths
        }
        for name, p in paths.items():
            if os.path.exists(p):
                try:
                    with rasterio.open(p) as src:
                        self.raster_cache[name] = {
                            "data": src.read(1),
                            "transform": src.transform,
                            "height": src.height,
                            "width": src.width,
                            "nodata": src.nodata
                        }
                except Exception as e:
                    print(f"Error caching {name}: {e}")

    def _sample_cached_raster(self, name: str, lon: float, lat: float, default_val: float = 0.0) -> float:
        rc = self.raster_cache.get(name)
        if not rc:
            return default_val
        try:
            inv = ~rc["transform"]
            col, row = inv * (lon, lat)
            col, row = int(round(col)), int(round(row))
            if 0 <= row < rc["height"] and 0 <= col < rc["width"]:
                val = float(rc["data"][row, col])
                if not math.isnan(val) and val != rc["nodata"] and val != -9999.0 and val != -32768.0:
                    return val
        except Exception:
            pass
        return default_val

    def get_features_for_location(self, lat: float, lon: float, date_str: str = "2024-07-15") -> Dict[str, float]:
        elev = self._sample_cached_raster("elevation", lon, lat, default_val=850.0)
        slope = self._sample_cached_raster("slope", lon, lat, default_val=22.0)
        aspect = self._sample_cached_raster("aspect", lon, lat, default_val=140.0)
        
        soil_feats = {}
        defaults = {"clay": 26.5, "sand": 40.0, "silt": 32.0, "bulk_density": 1.05, "organic_carbon": 68.0, "ph_h2o": 5.4, "nitrogen": 0.65}
        for p in self.soil_props:
            soil_feats[p] = self._sample_cached_raster(p, lon, lat, default_val=defaults[p])

        rf = self.rainfall_extractor.get_rainfall_for_date(lat, lon, date_str)
        if not rf:
            rf = {"rainfall_1_day": 45.0, "rainfall_3_day": 110.0, "rainfall_7_day": 180.0, "rainfall_30_day": 420.0}

        features = {
            "elevation": elev,
            "slope": slope,
            "aspect": aspect,
            **soil_feats,
            **rf
        }
        return features

    def evaluate_point_risk(self, lat: float, lon: float, date_str: str = "2024-07-15") -> Dict[str, Any]:
        features = self.get_features_for_location(lat, lon, date_str)
        risk_result = self.explainer.predict_risk(features)
        
        return {
            "latitude": lat,
            "longitude": lon,
            "date": date_str,
            "risk_score": risk_result["risk_score"],
            "risk_level": risk_result["risk_level"],
            "color": risk_result["color"],
            "contributing_factors": risk_result["contributing_factors"],
            "summary": risk_result["summary"],
            "features": features
        }

    def _compute_pilot_grid(self, grid_res: int = 25) -> List[Dict[str, Any]]:
        lats = np.linspace(self.pilot_bounds["lat_min"], self.pilot_bounds["lat_max"], grid_res)
        lons = np.linspace(self.pilot_bounds["lon_min"], self.pilot_bounds["lon_max"], grid_res)
        
        grid_points = []
        for lat in lats:
            for lon in lons:
                elev = self._sample_cached_raster("elevation", lon, lat, default_val=600.0)
                slope = self._sample_cached_raster("slope", lon, lat, default_val=18.0)
                clay = self._sample_cached_raster("clay", lon, lat, default_val=26.5)
                bd = self._sample_cached_raster("bulk_density", lon, lat, default_val=1.05)
                
                lat_norm = (lat - self.pilot_bounds["lat_min"]) / (self.pilot_bounds["lat_max"] - self.pilot_bounds["lat_min"])
                lon_norm = (lon - self.pilot_bounds["lon_min"]) / (self.pilot_bounds["lon_max"] - self.pilot_bounds["lon_min"])
                r3d = float(60.0 + 90.0 * (lat_norm * 0.6 + lon_norm * 0.4))
                r1d = float(r3d * 0.45)
                r7d = float(r3d * 1.8)
                r30d = float(r3d * 3.6)
                
                feat = {
                    "elevation": elev, "slope": slope, "aspect": 140.0,
                    "clay": clay, "sand": 40.0, "silt": 32.0, "bulk_density": bd,
                    "organic_carbon": 68.0, "ph_h2o": 5.4, "nitrogen": 0.65,
                    "rainfall_1_day": r1d, "rainfall_3_day": r3d, "rainfall_7_day": r7d, "rainfall_30_day": r30d
                }
                
                res = self.explainer.predict_risk(feat)
                grid_points.append({
                    "lat": round(float(lat), 5),
                    "lon": round(float(lon), 5),
                    "risk_score": res["risk_score"],
                    "risk_level": res["risk_level"],
                    "slope": round(float(slope), 1),
                    "elevation": round(float(elev), 1),
                    "rainfall_3d": round(float(r3d), 1),
                    "color": res["color"]
                })
        return grid_points

    def generate_pilot_risk_grid(self, date_str: str = "2024-07-15", grid_res: int = 25) -> List[Dict[str, Any]]:
        if grid_res == 25 and self.cached_grid:
            return self.cached_grid
        return self._compute_pilot_grid(grid_res=grid_res)
