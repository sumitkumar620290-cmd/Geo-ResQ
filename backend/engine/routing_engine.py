from typing import Dict, Any, List

ROUTES_CATALOG = {
    "pasighat_to_roing": {
        "title": "Pasighat to Roing Transit Corridor",
        "origin": "Pasighat",
        "destination": "Roing",
        "primary_route": {
            "name": "NH-13 via Mebo & Dambuk High-Slope Hill Cut",
            "distance_km": 68.5,
            "estimated_time_mins": 95,
            "overall_risk_score": 78,
            "risk_level": "HIGH",
            "critical_hazard_segments": [
                {"segment_name": "Aohali Hill Section MP 48-52", "slope_deg": 38.2, "hazard": "Active debris sliding and falling boulders"}
            ],
            "waypoints": [
                [28.0664, 95.3267], [28.1284, 95.4210], [28.1633, 95.4598],
                [28.1725, 95.5342], [28.1480, 95.6210], [28.1612, 95.7485], [28.1402, 95.8351]
            ]
        },
        "recommended_alternative_route": {
            "name": "Lower Valley Bypass via Siluk - Paglam Low-Gradient Corridor",
            "distance_km": 74.2,
            "estimated_time_mins": 105,
            "overall_risk_score": 24,
            "risk_level": "LOW",
            "safety_rationale": "Recommended alternative: Diverts away from steep mountain cuts (slopes < 12°) and remains on flood-protected alluvial plain with zero active rockfall hazards.",
            "waypoints": [
                [28.0664, 95.3267], [28.0845, 95.4621], [28.0210, 95.5120],
                [28.0950, 95.6800], [28.1402, 95.8351]
            ]
        }
    },
    "roing_to_mayudia": {
        "title": "Roing to Mayudia Pass Border Road",
        "origin": "Roing",
        "destination": "Mayudia",
        "primary_route": {
            "name": "NH-313 Direct Mountain Pass",
            "distance_km": 54.2,
            "estimated_time_mins": 110,
            "overall_risk_score": 88,
            "risk_level": "CRITICAL",
            "critical_hazard_segments": [
                {"segment_name": "Mayudia Pass S-Bends MP 18-24", "slope_deg": 44.5, "hazard": "Imminent rockfall and saturated mudflow across roadway"}
            ],
            "waypoints": [
                [28.1402, 95.8351], [28.1850, 95.8640], [28.2415, 95.9120]
            ]
        },
        "recommended_alternative_route": {
            "name": "Controlled Staging Corridor with Road-Clearance Escort",
            "distance_km": 54.2,
            "estimated_time_mins": 130,
            "overall_risk_score": 48,
            "risk_level": "MODERATE (CAUTION)",
            "safety_rationale": "No bypass road exists in high-elevation mountain terrain. System recommends holding at Roing Staging Ground until BRO earthmovers complete slope stabilization.",
            "waypoints": [
                [28.1402, 95.8351], [28.1650, 95.8500], [28.2000, 95.8800]
            ]
        }
    }
}

class RoutingEngine:
    def __init__(self):
        self.catalog = ROUTES_CATALOG

    def get_route_options(self) -> List[Dict[str, Any]]:
        return [
            {
                "key": k,
                "title": v["title"],
                "origin": v["origin"],
                "destination": v["destination"]
            }
            for k, v in self.catalog.items()
        ]

    def evaluate_route(self, route_key: str = "pasighat_to_roing") -> Dict[str, Any]:
        route_data = self.catalog.get(route_key, self.catalog["pasighat_to_roing"])
        return {
            "route_key": route_key,
            "title": route_data["title"],
            "origin": route_data["origin"],
            "destination": route_data["destination"],
            "primary_route": route_data["primary_route"],
            "recommended_alternative_route": route_data["recommended_alternative_route"],
            "system_recommendation": f"Alternative route recommended because primary highway passes through a {route_data['primary_route']['risk_level']} landslide risk zone."
        }
