import pytest
from app.services.scoring_engine import calculate_security_score

def test_clean_scan_score():
    """A scan with 0 findings must score 100/100."""
    result = calculate_security_score([])
    assert result["score"] == 100
    assert result["severity_breakdown"].total == 0

def test_single_critical_finding():
    """A single critical finding applies 25 point penalty."""
    findings = [{"severity": "critical"}]
    result = calculate_security_score(findings)
    assert result["score"] == 75
    assert result["severity_breakdown"].critical == 1

def test_diminishing_returns_cap():
    """Multiple findings in the same tier should be capped at the tier maximum."""
    # 5 Critical findings would be 5 * 25 = 125 without cap, but cap is 45
    findings = [{"severity": "critical"} for _ in range(5)]
    result = calculate_security_score(findings)
    assert result["score"] == 55 # 100 - 45 cap
    assert result["severity_breakdown"].critical == 5

def test_mixed_severity_findings():
    findings = [
        {"severity": "high"},
        {"severity": "medium"},
        {"severity": "low"},
        {"severity": "informational"}
    ]
    # high: 15, medium: 8, low: 3, info: 0.5 => 26.5 total penalty => 74
    result = calculate_security_score(findings)
    assert result["score"] == 74
    assert result["severity_breakdown"].high == 1
    assert result["severity_breakdown"].medium == 1
    assert result["severity_breakdown"].low == 1
    assert result["severity_breakdown"].informational == 1
    assert result["severity_breakdown"].total == 4
