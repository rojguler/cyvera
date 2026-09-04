from typing import List, Dict, Any
from app.schemas.scan import SeverityCount

# Weight penalties per vulnerability severity
SEVERITY_WEIGHTS = {
    "critical": 25.0,
    "high": 15.0,
    "medium": 8.0,
    "low": 3.0,
    "informational": 0.5,
}

# Diminishing returns caps per severity tier
TIER_CAPS = {
    "critical": 45.0,
    "high": 35.0,
    "medium": 25.0,
    "low": 12.0,
    "informational": 3.0,
}

def calculate_security_score(findings: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes a deterministic security score (0-100) and severity breakdown.
    The LLM never computes or influences this score.
    """
    counts = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
        "informational": 0,
    }

    for f in findings:
        sev = str(f.get("severity", "informational")).lower()
        if sev in counts:
            counts[sev] += 1
        else:
            counts["informational"] += 1

    # Calculate capped penalty per tier
    total_penalty = 0.0
    for tier, count in counts.items():
        weight = SEVERITY_WEIGHTS.get(tier, 0.5)
        cap = TIER_CAPS.get(tier, 10.0)
        raw_penalty = count * weight
        tier_penalty = min(raw_penalty, cap)
        total_penalty += tier_penalty

    base_score = 100.0
    final_score = int(max(0, min(100, round(base_score - total_penalty))))

    severity_breakdown = SeverityCount(
        critical=counts["critical"],
        high=counts["high"],
        medium=counts["medium"],
        low=counts["low"],
        informational=counts["informational"],
        total=sum(counts.values())
    )

    return {
        "score": final_score,
        "severity_breakdown": severity_breakdown,
        "total_penalty": total_penalty
    }
