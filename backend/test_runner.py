import unittest
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.scoring_engine import calculate_security_score
from app.services.finding_parser import parse_zap_alert
from app.services.ssrf_guard import validate_scan_target_url
from app.core.exceptions import SSRFSecurityException
from app.config import settings

class TestCyveraBackend(unittest.TestCase):

    def test_clean_scan_score(self):
        """0 findings should produce score 100/100."""
        res = calculate_security_score([])
        self.assertEqual(res["score"], 100)
        self.assertEqual(res["severity_breakdown"].total, 0)

    def test_critical_finding_penalty(self):
        """1 Critical finding should apply -25 penalty."""
        res = calculate_security_score([{"severity": "critical"}])
        self.assertEqual(res["score"], 75)
        self.assertEqual(res["severity_breakdown"].critical, 1)

    def test_diminishing_returns_cap(self):
        """Multiple critical findings capped at -45."""
        findings = [{"severity": "critical"} for _ in range(5)]
        res = calculate_security_score(findings)
        self.assertEqual(res["score"], 55)

    def test_finding_parser_elevation(self):
        """High risk SQL injection alert is elevated to Critical."""
        raw_alert = {
            "pluginId": "40018",
            "alert": "SQL Injection",
            "riskcode": "3",
            "confidence": "3",
            "url": "https://example.com/api/user?id=1",
            "method": "GET"
        }
        parsed = parse_zap_alert(raw_alert)
        self.assertEqual(parsed["finding"]["severity"], "critical")
        self.assertEqual(parsed["vulnerability"]["plugin_id"], "40018")

    def test_ssrf_validation(self):
        """SSRF guard validates valid https URLs."""
        url = "https://owasp.org"
        validated = validate_scan_target_url(url)
        self.assertTrue(validated.startswith("https://"))

    def test_ssrf_blocked_metadata(self):
        """SSRF guard blocks AWS metadata when allow_local is False."""
        old_val = settings.ALLOW_LOCAL_TARGETS
        try:
            settings.ALLOW_LOCAL_TARGETS = False
            with self.assertRaises(SSRFSecurityException):
                validate_scan_target_url("http://169.254.169.254/latest/meta-data/")
        finally:
            settings.ALLOW_LOCAL_TARGETS = old_val

if __name__ == "__main__":
    unittest.main(verbosity=2)
