import pytest
from app.services.ssrf_guard import validate_scan_target_url
from app.core.exceptions import SSRFSecurityException
from app.config import settings

def test_valid_https_url():
    url = "https://owasp.org"
    validated = validate_scan_target_url(url)
    assert validated.startswith("https://")

def test_missing_scheme_defaults_to_https():
    url = "example.com"
    validated = validate_scan_target_url(url)
    assert validated.startswith("https://example.com")

def test_invalid_scheme_blocked():
    with pytest.raises(SSRFSecurityException):
        validate_scan_target_url("ftp://ftp.example.com")

def test_production_ssrf_blocks_metadata():
    # Temporarily enforce production rules for testing
    old_val = settings.ALLOW_LOCAL_TARGETS
    try:
        settings.ALLOW_LOCAL_TARGETS = False
        with pytest.raises(SSRFSecurityException):
            validate_scan_target_url("http://169.254.169.254/latest/meta-data/")
        with pytest.raises(SSRFSecurityException):
            validate_scan_target_url("http://localhost:8080")
        with pytest.raises(SSRFSecurityException):
            validate_scan_target_url("http://127.0.0.1:3000")
    finally:
        settings.ALLOW_LOCAL_TARGETS = old_val
