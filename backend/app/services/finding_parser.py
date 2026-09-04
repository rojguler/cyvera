from typing import List, Dict, Any
from app.services.owasp_mapping import map_alert_to_owasp

# Map ZAP riskcode / risk string to Cyvera severity
ZAP_RISK_MAP = {
    "0": "informational",
    "1": "low",
    "2": "medium",
    "3": "high",
    "informational": "informational",
    "low": "low",
    "medium": "medium",
    "high": "high",
}

# Vulnerabilities that qualify for Critical tier
CRITICAL_KEYWORDS = [
    "sql injection",
    "remote os command injection",
    "server side code injection",
    "remote code execution",
    "xxe",
    "unauthenticated",
]

def parse_zap_alert(alert: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parses a single ZAP alert into Cyvera canonical vulnerability and finding data structures.
    """
    plugin_id = str(alert.get("pluginId", alert.get("plugin_id", "0")))
    alert_name = str(alert.get("alert", alert.get("name", "Unknown Security Alert")))
    raw_risk = str(alert.get("riskcode", alert.get("risk", alert.get("severity", "0")))).lower()
    
    severity = ZAP_RISK_MAP.get(raw_risk, "informational")
    
    # Check if high finding qualifies as Critical
    name_lower = alert_name.lower()
    if severity == "high" and any(k in name_lower for k in CRITICAL_KEYWORDS):
        severity = "critical"

    # Numeric risk score equivalent (0-10)
    risk_score_map = {
        "critical": 9.5,
        "high": 7.5,
        "medium": 5.0,
        "low": 2.5,
        "informational": 0.5
    }
    risk_score = risk_score_map.get(severity, 1.0)

    # Confidence normalization
    raw_conf = str(alert.get("confidence", "Medium")).lower()
    if "high" in raw_conf or raw_conf == "3":
        confidence = "high"
    elif "low" in raw_conf or raw_conf == "1":
        confidence = "low"
    elif "false" in raw_conf or raw_conf == "0":
        confidence = "false_positive"
    else:
        confidence = "medium"

    cwe_id_raw = alert.get("cweid", alert.get("cwe_id"))
    cwe_id = int(cwe_id_raw) if cwe_id_raw and str(cwe_id_raw).isdigit() else None

    wasc_id_raw = alert.get("wascid", alert.get("wasc_id"))
    wasc_id = int(wasc_id_raw) if wasc_id_raw and str(wasc_id_raw).isdigit() else None

    owasp_category = alert.get("owasp_category") or map_alert_to_owasp(plugin_id, alert_name, cwe_id)

    vulnerability_data = {
        "plugin_id": plugin_id,
        "name": alert_name,
        "description": alert.get("description", "No description provided."),
        "solution": alert.get("solution", "Apply standard security remediation."),
        "reference": alert.get("reference", ""),
        "owasp_category": owasp_category,
        "cwe_id": cwe_id,
        "wasc_id": wasc_id,
    }

    finding_data = {
        "severity": severity,
        "risk_score": risk_score,
        "confidence": confidence,
        "affected_url": alert.get("url", alert.get("affected_url", "")),
        "http_method": alert.get("method", alert.get("http_method", "GET")),
        "parameter": alert.get("param", alert.get("parameter", "")),
        "attack": alert.get("attack", ""),
        "evidence": alert.get("evidence", ""),
        "other_info": alert.get("otherinfo", alert.get("other_info", "")),
    }

    return {
        "vulnerability": vulnerability_data,
        "finding": finding_data
    }

def parse_zap_alerts_batch(alerts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [parse_zap_alert(a) for a in alerts]
