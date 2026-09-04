# Cyvera Security Model & Responsible Testing Architecture

## 1. Authorized Testing Boundary
Cyvera is architected strictly for authorized security assessments, defensive engineering, DevSecOps pipelines, and portfolio demonstration.

### Non-Goals (Explicitly Prohibited)
- No credential stuffing or brute-forcing engines
- No automated exploit payload weaponization
- No unauthorized external target scanning
- No persistent backdoor installation

---

## 2. Server-Side Request Forgery (SSRF) Guard
All target URLs entered into the platform undergo strict SSRF validation before being passed to OWASP ZAP or any HTTP inspection routine:

1. **Scheme Validation**: Only `http://` and `https://` schemes are permitted.
2. **DNS & IP Resolution**: Hostnames are resolved against DNS.
3. **Subnet Filtering**: Requests targeting RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.0/8`, `::1`), and cloud metadata services (`169.254.169.254`, `metadata.google.internal`) are blocked in production environments.
4. **Local Testing Flag**: In local docker/development environments, `ALLOW_LOCAL_TARGETS=True` permits scanning the dedicated `vulnerable-app` container safely.

---

## 3. Authentication & Authorization
- **JWT Tokens**: 60-minute access token lifespan with 7-day refresh tokens.
- **Password Hashing**: Industry-standard `bcrypt` with 12 calculation rounds.
- **Resource Ownership Isolation**: Every target, scan, and vulnerability finding is scoped directly to `user_id`. Cross-tenant data inspection is impossible.
- **Rate Limiting**: `SlowAPI` enforces IP-level rate limits on authentication endpoints to prevent abuse.
- **Audit Logging**: All security actions (scan launches, target registrations, logins) are permanently journaled to the `audit_logs` table.
