"""
OWASP Top 10 (2021) Category Mapping for OWASP ZAP Alerts and CWEs.
"""

# Common ZAP plugin ID mappings
ZAP_PLUGIN_TO_OWASP = {
    # A01:2021 - Broken Access Control
    "40035": "A01:2021-Broken Access Control",           # Hidden File Finder
    "40034": "A01:2021-Broken Access Control",           # Directory Browsing
    "10045": "A01:2021-Broken Access Control",           # Source Code Disclosure - /WEB-INF folder
    
    # A02:2021 - Cryptographic Failures
    "10041": "A02:2021-Cryptographic Failures",         # HTTP to HTTPS Insecure Transition
    "10042": "A02:2021-Cryptographic Failures",         # HTTPS to HTTP Insecure Transition
    "10043": "A02:2021-Cryptographic Failures",         # User Controllable JavaScript Event
    "10044": "A02:2021-Cryptographic Failures",         # Big Redirect Detected (Potential Data Leak)
    "90011": "A02:2021-Cryptographic Failures",         # Weak SSL/TLS Ciphers
    
    # A03:2021 - Injection
    "40012": "A03:2021-Injection",                      # Cross Site Scripting (Reflected)
    "40014": "A03:2021-Injection",                      # Cross Site Scripting (Persistent)
    "40016": "A03:2021-Injection",                      # Cross Site Scripting (Persistent) - Prime
    "40017": "A03:2021-Injection",                      # Cross Site Scripting (Persistent) - Spider
    "40018": "A03:2021-Injection",                      # SQL Injection
    "40019": "A03:2021-Injection",                      # SQL Injection - MySQL
    "40020": "A03:2021-Injection",                      # SQL Injection - Hypersonic SQL
    "40021": "A03:2021-Injection",                      # SQL Injection - Oracle
    "40022": "A03:2021-Injection",                      # SQL Injection - PostgreSQL
    "40024": "A03:2021-Injection",                      # SQL Injection - SQLite
    "40026": "A03:2021-Injection",                      # Cross Site Scripting (DOM Based)
    "90019": "A03:2021-Injection",                      # Server Side Code Injection
    "90020": "A03:2021-Injection",                      # Remote OS Command Injection
    "90021": "A03:2021-Injection",                      # XPath Injection
    "90023": "A03:2021-Injection",                      # XML External Entity Attack
    
    # A05:2021 - Security Misconfiguration
    "10010": "A05:2021-Security Misconfiguration",      # Cookie No HttpOnly Flag
    "10011": "A05:2021-Security Misconfiguration",      # Cookie Without Secure Flag
    "10015": "A05:2021-Security Misconfiguration",      # Incomplete or No Cache-Control Header
    "10020": "A05:2021-Security Misconfiguration",      # Anti-clickjacking Header Not Set (X-Frame-Options)
    "10021": "A05:2021-Security Misconfiguration",      # X-Content-Type-Options Header Missing
    "10035": "A05:2021-Security Misconfiguration",      # Strict-Transport-Security Header Not Set
    "10037": "A05:2021-Security Misconfiguration",      # Server Leaks Information via 'Server' HTTP Response Header Field
    "10038": "A05:2021-Security Misconfiguration",      # Content Security Policy (CSP) Header Not Set
    "10049": "A05:2021-Security Misconfiguration",      # Content-Type Header Missing
    "10055": "A05:2021-Security Misconfiguration",      # CSP: Wildcard Directive
    "10063": "A05:2021-Security Misconfiguration",      # Permissions-Policy Header Not Set
    
    # A07:2021 - Identification and Authentication Failures
    "10023": "A07:2021-Identification and Authentication Failures", # Information Disclosure - Debug Error Messages
    "10054": "A07:2021-Identification and Authentication Failures", # Cookie without SameSite Attribute
    "10056": "A07:2021-Identification and Authentication Failures", # X-Debug-Token Information Leak
    
    # A10:2021 - Server-Side Request Forgery (SSRF)
    "40046": "A10:2021-Server-Side Request Forgery (SSRF)",        # Server Side Request Forgery
}

def map_alert_to_owasp(plugin_id: str, alert_name: str = "", cwe_id: int = None) -> str:
    """
    Returns the appropriate OWASP Top 10 category for a given alert.
    """
    if str(plugin_id) in ZAP_PLUGIN_TO_OWASP:
        return ZAP_PLUGIN_TO_OWASP[str(plugin_id)]
    
    name_lower = (alert_name or "").lower()
    if "sql injection" in name_lower or "xss" in name_lower or "cross site scripting" in name_lower or "command injection" in name_lower:
        return "A03:2021-Injection"
    if "content security policy" in name_lower or "header" in name_lower or "clickjacking" in name_lower or "cors" in name_lower:
        return "A05:2021-Security Misconfiguration"
    if "cookie" in name_lower or "session" in name_lower or "auth" in name_lower:
        return "A07:2021-Identification and Authentication Failures"
    if "ssl" in name_lower or "tls" in name_lower or "crypto" in name_lower or "https" in name_lower:
        return "A02:2021-Cryptographic Failures"
    if "directory" in name_lower or "traversal" in name_lower or "access control" in name_lower or "privilege" in name_lower:
        return "A01:2021-Broken Access Control"
    if "ssrf" in name_lower or "request forgery" in name_lower:
        return "A10:2021-Server-Side Request Forgery (SSRF)"
    
    return "A05:2021-Security Misconfiguration"
