import uuid
from datetime import datetime
from typing import Dict, Any, List

SAMPLE_CITIZEN_REPORTS = [
    {
        "report_id": "rep_01",
        "timestamp": "2026-08-30 16:45:00",
        "citizen_name": "Tashi Tsering",
        "phone": "+91 94360 88712",
        "village": "Dambuk",
        "location_desc": "NH-13 Milepost 51 near Aohali culvert",
        "latitude": 28.1633,
        "longitude": 95.4598,
        "indicators": ["Ground Cracking (10cm wide)", "Mud & Water Seepage on Road"],
        "severity": "CRITICAL",
        "status": "VERIFIED_BY_ENGINEER",
        "admin_notes": "BRO earthmover team dispatched to clear culvert and inspect road foundation."
    },
    {
        "report_id": "rep_02",
        "timestamp": "2026-08-30 18:20:00",
        "citizen_name": "Mukesh Gogoi",
        "phone": "+91 98642 11984",
        "village": "Roing",
        "location_desc": "NH-313 towards Mayudia near S-Bend #2",
        "latitude": 28.1850,
        "longitude": 95.8640,
        "indicators": ["Fallen Rocks on Outer Lane", "Trees Tilting Downhill"],
        "severity": "HIGH",
        "status": "PENDING_REVIEW",
        "admin_notes": "Caution signs erected by local traffic police."
    }
]

class ReportsEngine:
    def __init__(self):
        self.reports = SAMPLE_CITIZEN_REPORTS.copy()

    def get_all_reports(self) -> List[Dict[str, Any]]:
        return self.reports

    def submit_report(self, citizen_name: str, phone: str, village: str, location_desc: str,
                      lat: float, lon: float, indicators: List[str], severity: str = "HIGH") -> Dict[str, Any]:
        rep = {
            "report_id": f"rep_{str(uuid.uuid4())[:6]}",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "citizen_name": citizen_name,
            "phone": phone,
            "village": village,
            "location_desc": location_desc,
            "latitude": lat,
            "longitude": lon,
            "indicators": indicators,
            "severity": severity,
            "status": "PENDING_REVIEW",
            "admin_notes": "Submitted via Citizen Hazard Portal. Awaiting geotechnical verification."
        }
        self.reports.insert(0, rep)
        return rep

    def update_report_status(self, report_id: str, status: str, admin_notes: str) -> bool:
        for rep in self.reports:
            if rep["report_id"] == report_id:
                rep["status"] = status
                rep["admin_notes"] = admin_notes
                return True
        return False
