import ipaddress
import socket
from urllib.parse import urlparse
from app.config import settings
from app.core.exceptions import SSRFSecurityException

# Blocked IP ranges & metadata services
BLOCKED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),   # AWS/GCP/Azure link-local cloud metadata
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.0.0.0/24"),
    ipaddress.ip_network("192.0.2.0/24"),
    ipaddress.ip_network("192.88.99.0/24"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("198.18.0.0/15"),
    ipaddress.ip_network("198.51.100.0/24"),
    ipaddress.ip_network("203.0.113.0/24"),
    ipaddress.ip_network("224.0.0.0/4"),     # Multicast
    ipaddress.ip_network("240.0.0.0/4"),     # Reserved
    ipaddress.ip_network("255.255.255.255/32"),
    # IPv6
    ipaddress.ip_network("::1/128"),         # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),        # IPv6 ULA
    ipaddress.ip_network("fe80::/10"),       # IPv6 link-local
]

BLOCKED_HOSTNAMES = [
    "localhost",
    "127.0.0.1",
    "metadata.google.internal",
    "169.254.169.254",
]

def validate_scan_target_url(raw_url: str) -> str:
    """
    Validates that a URL is safe to scan and does not attempt SSRF against
    cloud metadata or internal private networks.
    """
    if not raw_url or not isinstance(raw_url, str):
        raise SSRFSecurityException("Target URL cannot be empty")
    
    url = raw_url.strip()
    if "://" in url:
        parsed_scheme = url.split("://")[0].lower()
        if parsed_scheme not in ("http", "https"):
            raise SSRFSecurityException(f"Unsupported protocol scheme '{parsed_scheme}'. Only HTTP and HTTPS are permitted.")
    else:
        url = "https://" + url

    try:
        parsed = urlparse(url)
    except Exception:
        raise SSRFSecurityException("Malformed URL structure")

    if not parsed.scheme or parsed.scheme not in ("http", "https"):
        raise SSRFSecurityException("Only HTTP and HTTPS protocols are permitted for scanning")

    hostname = parsed.hostname
    if not hostname:
        raise SSRFSecurityException("Target URL does not contain a valid hostname")

    # In development mode, allow localhost / docker test app if configured
    if settings.ALLOW_LOCAL_TARGETS:
        return url

    # Production checks
    hostname_lower = hostname.lower()
    if hostname_lower in BLOCKED_HOSTNAMES or hostname_lower.endswith(".internal") or hostname_lower.endswith(".local"):
        raise SSRFSecurityException(f"Scanning internal hostname '{hostname}' is forbidden by security policy")

    try:
        # Resolve hostname to IP addresses
        addr_info = socket.getaddrinfo(hostname, None)
        ips = {info[4][0] for info in addr_info}
    except socket.gaierror:
        raise SSRFSecurityException(f"Unable to resolve DNS for target '{hostname}'")

    for ip_str in ips:
        try:
            ip_obj = ipaddress.ip_address(ip_str)
            for blocked in BLOCKED_NETWORKS:
                if ip_obj in blocked:
                    raise SSRFSecurityException(f"Target '{hostname}' resolves to restricted internal IP {ip_str}")
        except ValueError:
            raise SSRFSecurityException("Invalid IP address resolution")

    return url
