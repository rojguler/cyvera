import pytest
from app.services.finding_parser import parse_zap_alert

def test_parse_standard_zap_alert():
    raw_alert = {
        "pluginId": "10038",
        "alert": "Content Security Policy (CSP) Header Not Set",
        "riskcode": "2",
        "confidence": "3",
        "url": "https://example.com/",
        "method": "GET",
        "evidence": "No CSP Header",
        "description": "CSP description",
        "solution": "Add CSP header"
    }

    parsed = parse_zap_alert(raw_alert)
    assert parsed["vulnerability"]["plugin_id"] == "10038"
    assert parsed["vulnerability"]["name"] == "Content Security Policy (CSP) Header Not Set"
    assert parsed["finding"]["severity"] == "medium"
    assert parsed["finding"]["confidence"] == "high"
    assert parsed["finding"]["affected_url"] == "https://example.com/"

def test_critical_elevation_for_sql_injection():
    raw_alert = {
        "pluginId": "40018",
        "alert": "SQL Injection",
        "riskcode": "3", # High in ZAP
        "confidence": "3",
        "url": "https://example.com/api/user?id=1",
        "method": "GET",
        "evidence": "syntax error near unexpected token"
    }

    parsed = parse_zap_alert(raw_alert)
    # Must be elevated to Critical tier in Cyvera model
    assert parsed["finding"]["severity"] == "critical"
    assert parsed["finding"]["risk_score"] == 9.5
