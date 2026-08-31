import datetime
from typing import List, Dict, Any, Optional

class MockNotificationService:
    def __init__(self):
        self.subscribers = [
            {"id": "sub-1", "name": "Ramesh Pegu", "phone": "+91 98450 11223", "village": "Dambuk", "language": "English", "channel": "SMS"},
            {"id": "sub-2", "name": "Bamin Maya", "phone": "+91 94360 44556", "village": "Dambuk", "language": "Hindi", "channel": "SMS"},
            {"id": "sub-3", "name": "Tadar Tani", "phone": "+91 98620 77889", "village": "Aohali", "language": "Assamese", "channel": "SMS"},
            {"id": "sub-4", "name": "Sunita Das", "phone": "+91 97740 33445", "village": "Roing", "language": "Bengali", "channel": "SMS"},
            {"id": "sub-5", "name": "Kaling Moyong", "phone": "+91 96120 99001", "village": "Mebo", "language": "English", "channel": "WhatsApp"},
            {"id": "sub-6", "name": "Jumter Riba", "phone": "+91 94020 66778", "village": "Siluk", "language": "Hindi", "channel": "SMS"},
            {"id": "sub-7", "name": "District Magistrate Office", "phone": "+91 368 222222", "village": "Roing", "language": "English", "channel": "SMS"}
        ]
        self.dispatch_log = []

    def get_subscribers(self) -> List[Dict[str, Any]]:
        return self.subscribers

    def register_subscriber(self, name: str, phone: str, village: str, language: str = "English", channel: str = "SMS") -> Dict[str, Any]:
        sub_id = f"sub-{len(self.subscribers) + 1}"
        new_sub = {
            "id": sub_id,
            "name": name,
            "phone": phone,
            "village": village,
            "language": language,
            "channel": channel
        }
        self.subscribers.append(new_sub)
        return new_sub

    def _generate_localized_message(self, language: str, location: str, risk_score: int, safe_shelter: str) -> str:
        lang = language.upper()
        if "HINDI" in lang:
            return (
                f"🚨 GEORESQ चेतावनी: {location} क्षेत्र में भूस्खलन का गंभीर खतरा (स्कोर {risk_score}/100)। "
                f"कृपया पहाड़ी रास्तों से बचें और तुरंत सुरक्षित स्थान '{safe_shelter}' की ओर प्रस्थान करें। "
                f"यह GEORESQ प्रणाली की सिफ़ारिश है; स्थानीय प्रशासन के निर्देशों का पालन करें।"
            )
        elif "ASSAM" in lang:
            return (
                f"🚨 GEORESQ সতৰ্কবাৰ্তা: {location} এলেকাত ভূমিস্খলনৰ তীব্ৰ আশংকা (স্কোৰ {risk_score}/100)। "
                f"পাহাৰীয়া পথ ত্যাগ কৰক আৰু তৎকালীনভাৱে নিৰাপদ আশ্ৰয়স্থলী '{safe_shelter}'লৈ যাওক। "
                f"এইটো GEORESQ প্ৰণালীৰ পৰামৰ্শ; স্থানীয় প্ৰশাসনৰ নিৰ্দেশ অনুসৰণ কৰক।"
            )
        elif "BENGALI" in lang or "BANGLA" in lang:
            return (
                f"🚨 GEORESQ সতর্কতা: {location} এলাকায় মারাত্মক ভূমিধস ঝুঁকি (স্কোর {risk_score}/100)। "
                f"পাহাড়ি রাস্তা এড়িয়ে চলুন এবং দ্রুত নিরাপদ আশ্রয়স্থল '{safe_shelter}'-এ যান। "
                f"এটি GEORESQ সিস্টেম সুপারিশ; স্থানীয় প্রশাসনের নির্দেশ অনুসরণ করুন।"
            )
        else: # Default English
            return (
                f"🚨 GEORESQ ALERT: Critical landslide risk detected in {location} sector (Score: {risk_score}/100). "
                f"Avoid hillside roads and proceed toward designated shelter '{safe_shelter}'. "
                f"This is a GEORESQ system recommendation; follow official local authority directives."
            )

    def simulate_targeted_dispatch(self, location: str, risk_score: int, risk_level: str, safe_shelter: str = "Designated Community Center") -> Dict[str, Any]:
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        dispatched_items = []
        
        # Match subscribers belonging to this location or pilot area
        matched_subs = [s for s in self.subscribers if location.lower() in s["village"].lower() or s["village"].lower() in location.lower()]
        if not matched_subs:
            matched_subs = self.subscribers[:4] # Fallback to pilot responders

        for sub in matched_subs:
            msg = self._generate_localized_message(sub["language"], location, risk_score, safe_shelter)
            channel = sub.get("channel", "SMS").upper()
            
            if channel == "WHATSAPP":
                status = "NOT CONFIGURED (FUTURE API)"
                delivery_note = "WhatsApp Business API credentials not yet provisioned. Simulation recorded."
            else:
                status = "SIMULATED / DISPATCH RECORDED"
                delivery_note = "Zero-Cost Simulation Mode active. Message formatted and queued for telco gateway."

            record = {
                "id": f"alert-{len(self.dispatch_log) + 1}",
                "timestamp": timestamp,
                "recipient_name": sub["name"],
                "recipient_phone": sub["phone"],
                "village": sub["village"],
                "language": sub["language"],
                "channel": sub["channel"],
                "risk_score": risk_score,
                "risk_level": risk_level,
                "title": f"GEORESQ Emergency Warning — {location}",
                "message": msg,
                "status": status,
                "delivery_note": delivery_note
            }
            self.dispatch_log.insert(0, record)
            dispatched_items.append(record)

        return {
            "status": "SIMULATION_DISPATCH_RECORDED",
            "total_recipients": len(dispatched_items),
            "dispatched_notifications": dispatched_items
        }

    def get_dispatch_history(self) -> List[Dict[str, Any]]:
        return self.dispatch_log
