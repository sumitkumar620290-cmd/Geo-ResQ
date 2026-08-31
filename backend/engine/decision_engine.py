from typing import Dict, Any, List

class DecisionEngine:
    def __init__(self):
        pass

    def generate_recommendations(self, exposure_data: Dict[str, Any], risk_level: str, risk_score: int) -> Dict[str, Any]:
        """
        Translates (Risk Score + Exposed Infrastructure + Exposed Population) into
        prioritized operational system action recommendations.
        """
        actions = []
        priority_level = "ROUTINE"
        
        exposed_villages = exposure_data.get("exposed_villages", [])
        exposed_roads = exposure_data.get("exposed_roads", [])
        exposed_infra = exposure_data.get("exposed_infrastructure", [])
        total_pop = exposure_data.get("total_exposed_population", 0)

        # 1. CRITICAL Risk Decisions
        if risk_level == "CRITICAL" or risk_score >= 76:
            priority_level = "EMERGENCY_IMMEDIATE"
            
            # Settlement Actions
            if exposed_villages:
                v_names = ", ".join(v["name"] for v in exposed_villages)
                shelters = ", ".join(set(v.get("safe_shelter", "Designated Safe Ground") for v in exposed_villages))
                actions.append({
                    "priority": 1,
                    "category": "POPULATION_EVACUATION",
                    "target_entity": v_names,
                    "urgency": "IMMEDIATE",
                    "title": f"Initiate Pre-Evacuation Alert for {v_names}",
                    "action_text": f"Extreme slope instability detected. Alert {total_pop:,} residents in {v_names} to prepare immediate evacuation toward designated safe shelters ({shelters}). Avoid hill slopes and saturated embankments.",
                    "authority_target": "District Magistrate / SDMA / NDRF"
                })

            # Road Network Actions
            for r in exposed_roads:
                actions.append({
                    "priority": 1,
                    "category": "ROAD_CLOSURE",
                    "target_entity": r["name"],
                    "urgency": "IMMEDIATE",
                    "title": f"Suspend Traffic & Erect Checkpoints on {r['name']}",
                    "action_text": f"Severe landslide and rockfall risk identified along active mountain corridor. Enforce complete vehicular stoppage, deploy police checkpoints at entry junctions, and divert all traffic to lower-risk valley bypasses.",
                    "authority_target": "Traffic Police / BRO / PWD Highways"
                })

            # Critical Bridge & Hospital Actions
            for inf in exposed_infra:
                if inf["type"] == "Bridge":
                    actions.append({
                        "priority": 1,
                        "category": "INFRASTRUCTURE_PROTECTION",
                        "target_entity": inf["name"],
                        "urgency": "IMMEDIATE",
                        "title": f"Deploy Emergency Bridge Inspection at {inf['name']}",
                        "action_text": f"Potential debris flow and scour threat to structural abutments. Halt heavy vehicle transit across {inf['name']} until geotechnical clearance.",
                        "authority_target": "PWD Bridge Engineers / BRO"
                    })
                elif inf["type"] == "Hospital":
                    actions.append({
                        "priority": 2,
                        "category": "HEALTHCARE_PREPAREDNESS",
                        "target_entity": inf["name"],
                        "urgency": "URGENT",
                        "title": f"Pre-position Trauma Teams at {inf['name']}",
                        "action_text": f"Ensure backup power generators, emergency blood supplies, and ambulances are staged outside landslide flow paths.",
                        "authority_target": "Chief Medical Officer"
                    })

        # 2. HIGH Risk Decisions
        elif risk_level == "HIGH" or risk_score >= 51:
            priority_level = "HIGH_PRIORITY"
            
            if exposed_villages:
                v_names = ", ".join(v["name"] for v in exposed_villages)
                actions.append({
                    "priority": 2,
                    "category": "COMMUNITY_WARNING",
                    "target_entity": v_names,
                    "urgency": "URGENT",
                    "title": f"Broadcast Orange Warning Alert to {v_names}",
                    "action_text": f"High landslide susceptibility due to heavy rainfall accumulation. Advise {total_pop:,} residents to suspend non-essential travel, stay away from steep hillside cuts, and monitor local drainage flows.",
                    "authority_target": "District Disaster Management Office (DDMO)"
                })

            for r in exposed_roads:
                actions.append({
                    "priority": 2,
                    "category": "TRAFFIC_RESTRICTION",
                    "target_entity": r["name"],
                    "urgency": "URGENT",
                    "title": f"Deploy Warning Signage & One-Way Traffic on {r['name']}",
                    "action_text": f"Restrict night-time vehicular movement and deploy quick-response earth-moving excavators on standby along vulnerable bends.",
                    "authority_target": "PWD Highways / BRO"
                })

            for inf in exposed_infra:
                if inf["type"] == "School":
                    actions.append({
                        "priority": 3,
                        "category": "SCHOOL_SAFETY",
                        "target_entity": inf["name"],
                        "urgency": "HIGH",
                        "title": f"Temporary Class Suspension at {inf['name']}",
                        "action_text": "Suspend in-person activities for schools situated along hill slopes during peak rainfall hours.",
                        "authority_target": "District Education Officer"
                    })

        # 3. MODERATE Risk Decisions
        elif risk_level == "MODERATE" or risk_score >= 26:
            priority_level = "ADVISORY"
            actions.append({
                "priority": 3,
                "category": "ADVISORY_MONITORING",
                "target_entity": "Pilot Sector",
                "urgency": "MONITOR",
                "title": "Clear Highway Drainage Culverts & Monitor Soil Saturation",
                "action_text": "Inspect mountain road drains, culverts, and retaining walls for debris blockages. Maintain standard monsoon alertness.",
                "authority_target": "Local Administration / Municipal Engineering"
            })

        # 4. LOW Risk Decisions
        else:
            priority_level = "ROUTINE"
            actions.append({
                "priority": 4,
                "category": "ROUTINE",
                "target_entity": "Pilot Sector",
                "urgency": "ROUTINE",
                "title": "Routine Environmental Monitoring",
                "action_text": "Environmental conditions and slope stability parameters remain within normal baseline thresholds.",
                "authority_target": "Monitoring Cell"
            })

        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "priority_level": priority_level,
            "system_disclaimer": "System Recommendation: Automated decision-support guidance for disaster management authorities; verify with local field personnel.",
            "total_actions": len(actions),
            "recommendations": actions
        }
