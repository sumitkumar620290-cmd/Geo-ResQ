import os
import joblib
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "landsafe_risk_model.joblib")

class RiskExplainer:
    def __init__(self, model_path=MODEL_PATH):
        if os.path.exists(model_path):
            bundle = joblib.load(model_path)
            self.model = bundle['model']
            self.features = bundle['features']
            self.feature_importances = {item['feature']: item['importance'] for item in bundle['feature_importances']}
        else:
            self.model = None
            self.features = []
            self.feature_importances = {}

    def predict_risk(self, feature_dict):
        """
        Input: feature_dict containing values for:
          elevation, slope, aspect, clay, sand, silt, bulk_density,
          organic_carbon, ph_h2o, nitrogen, rainfall_1_day, rainfall_3_day,
          rainfall_7_day, rainfall_30_day
        Returns:
          risk_score: 0 - 100
          risk_level: LOW | MODERATE | HIGH | CRITICAL
          contributing_factors: List of dicts
          explanation: Formatted text
        """
        vec = np.array([[feature_dict.get(f, 0.0) for f in self.features]])
        prob = float(self.model.predict_proba(vec)[0, 1]) if self.model else 0.5
        
        # Risk score calibrated 0 - 100
        risk_score = int(round(prob * 100))
        
        if risk_score <= 25:
            risk_level = "LOW"
            color = "#10b981"
        elif risk_score <= 50:
            risk_level = "MODERATE"
            color = "#f59e0b"
        elif risk_score <= 75:
            risk_level = "HIGH"
            color = "#f97316"
        else:
            risk_level = "CRITICAL"
            color = "#ef4444"
            
        factors = []
        
        # Analyze Slope
        slope = feature_dict.get('slope', 0.0)
        if slope > 35:
            factors.append({
                "factor": "Steep Slope Gradient",
                "category": "Topography",
                "severity": "HIGH",
                "description": f"Terrain slope is {slope:.1f}°, well above the critical gravitational shear failure angle (30°)."
            })
        elif slope > 20:
            factors.append({
                "factor": "Moderate Slope Angle",
                "category": "Topography",
                "severity": "MODERATE",
                "description": f"Terrain slope is {slope:.1f}°, presenting moderate slope instability."
            })
            
        # Analyze Rainfall
        r3d = feature_dict.get('rainfall_3_day', 0.0)
        r1d = feature_dict.get('rainfall_1_day', 0.0)
        r30d = feature_dict.get('rainfall_30_day', 0.0)
        
        if r3d > 100 or r1d > 60:
            factors.append({
                "factor": "Extreme Storm Precipitation",
                "category": "Meteorology",
                "severity": "CRITICAL",
                "description": f"Short-term rainfall ({r3d:.1f}mm 3-day, {r1d:.1f}mm 1-day) severely elevates transient pore-water pressure."
            })
        elif r3d > 45 or r1d > 25:
            factors.append({
                "factor": "Elevated Antecedent Rainfall",
                "category": "Meteorology",
                "severity": "HIGH",
                "description": f"Cumulative 3-day rainfall ({r3d:.1f}mm) exceeds the regional saturation threshold."
            })
        elif r30d > 200:
            factors.append({
                "factor": "High Monsoon Soil Saturation",
                "category": "Meteorology",
                "severity": "MODERATE",
                "description": f"Prolonged monthly precipitation ({r30d:.1f}mm 30-day) keeps the soil matrix near capacity."
            })

        # Analyze Soil
        clay = feature_dict.get('clay', 0.0)
        bd = feature_dict.get('bulk_density', 0.0)
        if clay > 30:
            factors.append({
                "factor": "High Clay Plasticity",
                "category": "Soil Characteristics",
                "severity": "HIGH",
                "description": f"High clay fraction ({clay:.1f}%) reduces internal shear strength upon prolonged water saturation."
            })
        if bd < 1.0 and bd > 0:
            factors.append({
                "factor": "Low Bulk Density / High Porosity",
                "category": "Soil Characteristics",
                "severity": "MODERATE",
                "description": f"Bulk density ({bd:.2f} g/cm³) indicates unconsolidated soil prone to rapid infiltration and debris mobilization."
            })
            
        # Summary text
        if not factors:
            factors.append({
                "factor": "Stable Environmental Conditions",
                "category": "General",
                "severity": "LOW",
                "description": "Low slope gradient, moderate soil texture, and low antecedent rainfall indicate stable terrain."
            })
            
        summary_lines = [f"Risk Score: {risk_score}/100 ({risk_level})"]
        for f in factors:
            summary_lines.append(f"• [{f['category']}] {f['factor']}: {f['description']}")
            
        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "color": color,
            "contributing_factors": factors,
            "summary": "\n".join(summary_lines)
        }

if __name__ == "__main__":
    explainer = RiskExplainer()
    sample = {
        'elevation': 1420.0,
        'slope': 39.5,
        'aspect': 145.0,
        'clay': 32.5,
        'sand': 38.0,
        'silt': 29.5,
        'bulk_density': 0.98,
        'organic_carbon': 78.0,
        'ph_h2o': 5.2,
        'nitrogen': 0.72,
        'rainfall_1_day': 75.0,
        'rainfall_3_day': 160.0,
        'rainfall_7_day': 240.0,
        'rainfall_30_day': 510.0
    }
    res = explainer.predict_risk(sample)
    print("Risk Explanation Output:")
    print(res["summary"])
