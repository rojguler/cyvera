# Cyvera Security Scoring Engine — Mathematical Specification

## 1. Overview
The Cyvera Security Score is a deterministic 0–100 integer representing the security posture of an authorized target application. To maintain audit compliance, reproducibility, and prevent hallucinations, **Large Language Models (Gemini AI) never determine or modify this score**.

---

## 2. Penalty Weights

Every discovered vulnerability finding applies a deduction based on its categorized severity:

| Severity Tier | Single Finding Penalty | Diminishing Returns Tier Cap |
| :--- | :---: | :---: |
| **Critical** (e.g. SQLi, RCE) | `-25.0` pts | `-45.0` pts |
| **High** (e.g. Reflected XSS) | `-15.0` pts | `-35.0` pts |
| **Medium** (e.g. Missing CSP) | `-8.0` pts | `-25.0` pts |
| **Low** (e.g. Missing nosniff) | `-3.0` pts | `-12.0` pts |
| **Informational** (e.g. Server banner) | `-0.5` pt | `-3.0` pts |

---

## 3. Tier-Capping & Formula

To avoid a single repeated low-priority finding reducing a system's score to zero, diminishing returns caps are enforced per severity tier:

```python
def calculate_tier_penalty(count: int, weight: float, cap: float) -> float:
    return min(count * weight, cap)

total_deduction = (
    calculate_tier_penalty(critical_count, 25.0, 45.0) +
    calculate_tier_penalty(high_count, 15.0, 35.0) +
    calculate_tier_penalty(medium_count, 8.0, 25.0) +
    calculate_tier_penalty(low_count, 3.0, 12.0) +
    calculate_tier_penalty(info_count, 0.5, 3.0)
)

final_score = int(max(0, min(100, round(100.0 - total_deduction))))
```

---

## 4. Posture Classification

- **80 – 100:** Strong Security Posture (Green)
- **60 – 79:** Moderate Risk / Attention Required (Amber)
- **0 – 59:** Critical Risk / Urgent Remediation Required (Red)
