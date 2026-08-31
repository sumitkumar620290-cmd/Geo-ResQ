import math
from typing import List, Dict, Any

# Verified geospatial database for Arunachal Pradesh Pilot Corridor
# (East Siang, Upper Siang, Lower Dibang Valley along NH-13 and NH-313)

VILLAGES = [
    {"id": "v_01", "name": "Dambuk", "district": "Lower Dibang Valley", "lat": 28.1725, "lon": 95.5342, "population": 4850, "elevation_m": 240, "safe_shelter": "Dambuk Higher Secondary School"},
    {"id": "v_02", "name": "Roing", "district": "Lower Dibang Valley", "lat": 28.1402, "lon": 95.8351, "population": 11380, "elevation_m": 390, "safe_shelter": "Roing Multipurpose Community Hall"},
    {"id": "v_03", "name": "Mebo", "district": "East Siang", "lat": 28.1284, "lon": 95.4210, "population": 3620, "elevation_m": 185, "safe_shelter": "Mebo Government College Ground"},
    {"id": "v_04", "name": "Aohali", "district": "East Siang", "lat": 28.1633, "lon": 95.4598, "population": 1240, "elevation_m": 310, "safe_shelter": "Aohali Community Center"},
    {"id": "v_05", "name": "Mayudia", "district": "Lower Dibang Valley", "lat": 28.2415, "lon": 95.9120, "population": 680, "elevation_m": 2655, "safe_shelter": "Mayudia Pass Tourist Lodge Ground"},
    {"id": "v_06", "name": "Siluk", "district": "East Siang", "lat": 28.0845, "lon": 95.4621, "population": 2150, "elevation_m": 160, "safe_shelter": "Siluk Model Village Center"},
    {"id": "v_07", "name": "Mariyang", "district": "Upper Siang", "lat": 28.3712, "lon": 95.2341, "population": 3120, "elevation_m": 1120, "safe_shelter": "Mariyang Stadium Complex"},
    {"id": "v_08", "name": "Damro", "district": "Upper Siang", "lat": 28.4215, "lon": 95.2640, "population": 1450, "elevation_m": 1040, "safe_shelter": "Damro Village Council Hall"},
    {"id": "v_09", "name": "Yingkiong", "district": "Upper Siang", "lat": 28.6184, "lon": 94.9982, "population": 8540, "elevation_m": 620, "safe_shelter": "Yingkiong General Ground"},
    {"id": "v_10", "name": "Boleng", "district": "Siang", "lat": 28.3245, "lon": 94.9812, "population": 5210, "elevation_m": 430, "safe_shelter": "Boleng Administrative Complex"},
    {"id": "v_11", "name": "Pasighat", "district": "East Siang", "lat": 28.0664, "lon": 95.3267, "population": 24650, "elevation_m": 155, "safe_shelter": "Pasighat Outdoor Stadium"},
    {"id": "v_12", "name": "Hunli", "district": "Lower Dibang Valley", "lat": 28.3210, "lon": 95.9620, "population": 1820, "elevation_m": 1380, "safe_shelter": "Hunli Inspection Bungalow Ground"},
    {"id": "v_13", "name": "Jia", "district": "Lower Dibang Valley", "lat": 28.1612, "lon": 95.7485, "population": 1940, "elevation_m": 310, "safe_shelter": "Jia Primary School Campus"},
    {"id": "v_14", "name": "Parbuk", "district": "Lower Dibang Valley", "lat": 28.1480, "lon": 95.6210, "population": 1670, "elevation_m": 220, "safe_shelter": "Parbuk Sports Club Ground"}
]

ROADS = [
    {
        "id": "r_01",
        "name": "NH-13 (Trans-Arunachal Highway — Pasighat-Mebo-Dambuk-Roing Section)",
        "type": "National Highway",
        "length_km": 68.5,
        "criticality": "HIGH",
        "waypoints": [
            [28.0664, 95.3267], [28.1284, 95.4210], [28.1633, 95.4598],
            [28.1725, 95.5342], [28.1480, 95.6210], [28.1612, 95.7485], [28.1402, 95.8351]
        ]
    },
    {
        "id": "r_02",
        "name": "NH-313 (Roing-Mayudia-Hunli-Anini Mountain Highway)",
        "type": "National Highway / Strategic Border Road",
        "length_km": 54.2,
        "criticality": "CRITICAL",
        "waypoints": [
            [28.1402, 95.8351], [28.1850, 95.8640], [28.2415, 95.9120],
            [28.2890, 95.9410], [28.3210, 95.9620]
        ]
    },
    {
        "id": "r_03",
        "name": "Pasighat - Mariyang - Yingkiong State Highway",
        "type": "State Highway",
        "length_km": 82.0,
        "criticality": "HIGH",
        "waypoints": [
            [28.0664, 95.3267], [28.2100, 95.2800], [28.3712, 95.2341],
            [28.4215, 95.2640], [28.6184, 94.9982]
        ]
    },
    {
        "id": "r_04",
        "name": "Mebo - Siluk - Paglam Valley Road",
        "type": "Rural Arterial Road",
        "length_km": 34.0,
        "criticality": "MODERATE",
        "waypoints": [
            [28.1284, 95.4210], [28.0845, 95.4621], [28.0210, 95.5120]
        ]
    }
]

INFRASTRUCTURE = [
    {"id": "inf_01", "name": "Dibang River Bridge (NH-13)", "type": "Bridge", "lat": 28.1520, "lon": 95.6940, "importance": "CRITICAL"},
    {"id": "inf_02", "name": "Sisseri River Bridge (Dambuk)", "type": "Bridge", "lat": 28.1690, "lon": 95.4980, "importance": "CRITICAL"},
    {"id": "inf_03", "name": "Mayudia Mountain Pass Bridge #4", "type": "Bridge", "lat": 28.2450, "lon": 95.9140, "importance": "CRITICAL"},
    {"id": "inf_04", "name": "Roing District Hospital", "type": "Hospital", "lat": 28.1390, "lon": 95.8310, "importance": "CRITICAL"},
    {"id": "inf_05", "name": "Dambuk Community Health Centre", "type": "Hospital", "lat": 28.1710, "lon": 95.5320, "importance": "HIGH"},
    {"id": "inf_06", "name": "Mebo Primary Health Centre", "type": "Hospital", "lat": 28.1270, "lon": 95.4190, "importance": "HIGH"},
    {"id": "inf_07", "name": "Mayudia Emergency First-Aid Post", "type": "Hospital", "lat": 28.2390, "lon": 95.9090, "importance": "HIGH"},
    {"id": "inf_08", "name": "Roing Government Higher Secondary School", "type": "School", "lat": 28.1430, "lon": 95.8380, "importance": "HIGH"},
    {"id": "inf_09", "name": "Dambuk Model School", "type": "School", "lat": 28.1740, "lon": 95.5360, "importance": "HIGH"},
    {"id": "inf_10", "name": "Aohali Primary School", "type": "School", "lat": 28.1640, "lon": 95.4610, "importance": "MODERATE"},
    {"id": "inf_11", "name": "Mebo Secondary School", "type": "School", "lat": 28.1290, "lon": 95.4230, "importance": "HIGH"},
    {"id": "inf_12", "name": "Siluk Upper Primary School", "type": "School", "lat": 28.0850, "lon": 95.4630, "importance": "MODERATE"}
]

class GISEngine:
    def __init__(self):
        self.villages = VILLAGES
        self.roads = ROADS
        self.infrastructure = INFRASTRUCTURE

    @staticmethod
    def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def get_all_gis_layers(self) -> Dict[str, Any]:
        return {
            "villages": self.villages,
            "roads": self.roads,
            "infrastructure": self.infrastructure,
            "summary": {
                "total_villages": len(self.villages),
                "total_population": sum(v["population"] for v in self.villages),
                "total_roads_km": sum(r["length_km"] for r in self.roads),
                "total_infrastructure": len(self.infrastructure)
            }
        }

    def analyze_exposure(self, center_lat: float, center_lon: float, risk_score: int, buffer_radius_km: float = 3.5) -> Dict[str, Any]:
        """
        Calculates all human settlements, road corridors, schools, hospitals, and bridges
        falling within the impact buffer of an elevated landslide risk zone.
        """
        exposed_villages = []
        exposed_infra = []
        exposed_roads = []
        total_exposed_pop = 0

        for v in self.villages:
            dist = self.haversine_distance_km(center_lat, center_lon, v["lat"], v["lon"])
            if dist <= buffer_radius_km:
                exposed_villages.append({
                    **v,
                    "distance_km": round(dist, 2)
                })
                total_exposed_pop += v["population"]

        for inf in self.infrastructure:
            dist = self.haversine_distance_km(center_lat, center_lon, inf["lat"], inf["lon"])
            if dist <= buffer_radius_km:
                exposed_infra.append({
                    **inf,
                    "distance_km": round(dist, 2)
                })

        for r in self.roads:
            # Check minimum distance to any waypoint of the road
            min_dist = min(self.haversine_distance_km(center_lat, center_lon, pt[0], pt[1]) for pt in r["waypoints"])
            if min_dist <= buffer_radius_km:
                exposed_roads.append({
                    **r,
                    "distance_km": round(min_dist, 2)
                })

        return {
            "center_coordinates": [center_lat, center_lon],
            "buffer_radius_km": buffer_radius_km,
            "risk_score": risk_score,
            "total_exposed_population": total_exposed_pop,
            "exposed_villages": exposed_villages,
            "exposed_infrastructure": exposed_infra,
            "exposed_roads": exposed_roads,
            "counts": {
                "villages": len(exposed_villages),
                "schools": sum(1 for x in exposed_infra if x["type"] == "School"),
                "hospitals": sum(1 for x in exposed_infra if x["type"] == "Hospital"),
                "bridges": sum(1 for x in exposed_infra if x["type"] == "Bridge"),
                "roads": len(exposed_roads)
            }
        }
