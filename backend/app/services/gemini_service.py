import json
import logging
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self._client = None

    def _get_client(self):
        if self._client is None and self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Failed to initialize modern google.genai Client: {e}")
        return self._client

    def analyze_finding(self, finding_data: Dict[str, Any], vulnerability_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates structured AI explanation, threat context, impact and remediation code
        for a specific vulnerability finding using the modern Google GenAI SDK.
        """
        client = self._get_client()

        if client:
            try:
                from google.genai import types

                system_instruction = (
                    "You are a principal application security engineer and DevSecOps specialist. "
                    "Analyze the given web application vulnerability finding. "
                    "Return ONLY a valid JSON object matching the exact schema specified below. "
                    "Do not include markdown formatting like ```json ... ``` or any text outside the JSON. "
                    "Do NOT attempt to change or judge the risk score/severity. Focus on clear developer-friendly fix guidance.\n\n"
                    "Required JSON Schema:\n"
                    "{\n"
                    '  "explanation": "Clear, concise technical explanation of what this vulnerability is and why it exists.",\n'
                    '  "why_it_matters": "Why this specific finding represents a risk to the application or business.",\n'
                    '  "potential_impact": "Direct security impacts (e.g. session hijacking, credential theft, data tampering, defacement).",\n'
                    '  "evidence_interpretation": "Interpretation of the scanner evidence payload or missing response parameter.",\n'
                    '  "remediation": "Step-by-step remediation instructions for developers and sysadmins.",\n'
                    '  "fix_guidance": "Concrete code snippet or server configuration example (e.g. Nginx, Express, FastAPI, Django) showing the fix."\n'
                    "}"
                )

                prompt_input = {
                    "vulnerability_name": vulnerability_data.get("name"),
                    "severity": finding_data.get("severity"),
                    "affected_url": finding_data.get("affected_url"),
                    "http_method": finding_data.get("http_method"),
                    "parameter": finding_data.get("parameter"),
                    "evidence": finding_data.get("evidence"),
                    "owasp_category": vulnerability_data.get("owasp_category"),
                    "cwe_id": vulnerability_data.get("cwe_id"),
                    "raw_description": vulnerability_data.get("description")
                }

                config = types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.2,
                    response_mime_type="application/json"
                )

                response = client.models.generate_content(
                    model=self.model_name,
                    contents=json.dumps(prompt_input, indent=2),
                    config=config
                )

                content = response.text.strip()
                if content.startswith("```json"):
                    content = content[7:]
                if content.endswith("```"):
                    content = content[:-3]
                
                result = json.loads(content.strip(), strict=False)
                return {
                    "explanation": result.get("explanation", ""),
                    "why_it_matters": result.get("why_it_matters", ""),
                    "potential_impact": result.get("potential_impact", ""),
                    "evidence_interpretation": result.get("evidence_interpretation", ""),
                    "remediation": result.get("remediation", ""),
                    "fix_guidance": result.get("fix_guidance", ""),
                    "model_version": self.model_name
                }
            except Exception as e:
                logger.warning(f"Google GenAI API request failed: {e}. Falling back to rule-based security expert engine.")

        # Offline / Fallback Expert Engine (Deterministic security knowledge synthesis)
        return self._generate_expert_fallback(finding_data, vulnerability_data)

    def _generate_expert_fallback(self, finding_data: Dict[str, Any], vulnerability_data: Dict[str, Any]) -> Dict[str, Any]:
        """Synthesizes high-fidelity security insights when offline or API key is not configured."""
        name = vulnerability_data.get("name", "Web Vulnerability")
        sev = finding_data.get("severity", "medium")
        param = finding_data.get("parameter") or "N/A"
        evidence = finding_data.get("evidence") or "Discovered during HTTP response inspection."
        owasp = vulnerability_data.get("owasp_category") or "A05:2021-Security Misconfiguration"
        url = finding_data.get("affected_url", "target application")

        name_lower = name.lower()

        if "content security policy" in name_lower or "csp" in name_lower:
            return {
                "explanation": "Content Security Policy (CSP) is a foundational HTTP defense mechanism that restricts which scripts, styles, frames, and images a browser is permitted to execute.",
                "why_it_matters": "Without a valid Content-Security-Policy header, any injected malicious script (via XSS or compromised CDN dependencies) can execute with full user privileges in the victim's browser session.",
                "potential_impact": "Account takeover via token exfiltration, inline script injection, credential harvesting, and cross-site DOM defacement.",
                "evidence_interpretation": f"The HTTP response from {url} omitted the Content-Security-Policy header.",
                "remediation": "Deploy a strict Content-Security-Policy header starting in Report-Only mode, then enforce default-src 'self' with explicit script-src hashes or nonces.",
                "fix_guidance": (
                    "# Nginx Example:\n"
                    "add_header Content-Security-Policy \"default-src 'self'; script-src 'self' https://trustedscripts.example.com; object-src 'none'; frame-ancestors 'none';\" always;\n\n"
                    "# FastAPI / Starlette Example:\n"
                    "@app.middleware('http')\n"
                    "async def add_security_headers(request, call_next):\n"
                    "    response = await call_next(request)\n"
                    "    response.headers['Content-Security-Policy'] = \"default-src 'self';\"\n"
                    "    return response"
                ),
                "model_version": "cyvera-expert-v1"
            }

        elif "anti-clickjacking" in name_lower or "x-frame-options" in name_lower:
            return {
                "explanation": "Clickjacking (UI redressing) occurs when an attacker renders your web application inside an invisible <iframe> on a malicious site, tricking authenticated users into clicking unintended buttons.",
                "why_it_matters": "Attackers can trick users into authorizing wire transfers, modifying passwords, or granting OAuth permissions without their knowledge.",
                "potential_impact": "Unauthorized state-changing transactions, CSRF bypass, and inadvertent account modification.",
                "evidence_interpretation": "Neither X-Frame-Options nor the CSP 'frame-ancestors' directive was supplied in the response headers.",
                "remediation": "Instruct modern browsers never to embed your application in foreign frames using X-Frame-Options: DENY or SAMEORIGIN.",
                "fix_guidance": (
                    "# Nginx Configuration:\n"
                    "add_header X-Frame-Options \"DENY\" always;\n\n"
                    "# Express.js (Helmet):\n"
                    "app.use(helmet.frameguard({ action: 'deny' }));"
                ),
                "model_version": "cyvera-expert-v1"
            }

        elif "cross site scripting" in name_lower or "xss" in name_lower:
            return {
                "explanation": "Reflected Cross-Site Scripting occurs when untrusted user input is immediately included in the HTTP response HTML without proper escaping or contextual sanitization.",
                "why_it_matters": "Attackers can construct malicious URLs containing embedded JavaScript and send them to legitimate users. When clicked, the script runs within the trusted application context.",
                "potential_impact": "Full session hijacking, theft of document.cookie and localStorage tokens, automated phishing overlays, and client-side actions on behalf of the user.",
                "evidence_interpretation": f"Payload '{finding_data.get('attack', '<script>alert(1)</script>')}' was reflected verbatim in response parameter '{param}'.",
                "remediation": "1. Never reflect raw user input in HTML markup.\n2. Use modern templating engines (React, Jinja2 autoescape) that escape HTML entities automatically.\n3. Validate parameter inputs against strict allowlists.",
                "fix_guidance": (
                    "# Python / Jinja2 / FastAPI Safe Rendering:\n"
                    "from html import escape\n"
                    "safe_query = escape(user_query)\n\n"
                    "# React / TS (Best Practice):\n"
                    "// React JSX automatically escapes variables by default:\n"
                    "<div>Search results for: {searchTerm}</div>"
                ),
                "model_version": "cyvera-expert-v1"
            }

        elif "sql injection" in name_lower:
            return {
                "explanation": "SQL Injection occurs when untrusted input is concatenated directly into a database query string rather than using parameterized queries or prepared statements.",
                "why_it_matters": "It is one of the most destructive web vulnerabilities, granting unauthorized attackers direct access to read, modify, or delete the entire database.",
                "potential_impact": "Mass data breach, bypass of authentication tables, remote command execution (RCE) via database extensions, and permanent data loss.",
                "evidence_interpretation": f"Parameter '{param}' triggered database syntax alterations or differential response times.",
                "remediation": "Migrate all database interactions to parameterized queries via ORMs (SQLAlchemy, Prisma, TypeORM) or prepared statements. Never use raw string formatting.",
                "fix_guidance": (
                    "# SQLAlchemy (Safe - Parameterized):\n"
                    "user = db.query(User).filter(User.username == username_input).first()\n\n"
                    "# Raw SQL with Parameters (Safe):\n"
                    "cursor.execute('SELECT * FROM users WHERE username = %s', (username_input,))"
                ),
                "model_version": "cyvera-expert-v1"
            }

        # Generic default
        return {
            "explanation": f"{name} is a security flaw identified in category {owasp}.",
            "why_it_matters": f"Leaving this finding unaddressed increases the attack surface against {url}.",
            "potential_impact": "Security degradation, unauthorized information disclosure, or violation of security best practices.",
            "evidence_interpretation": f"Scanner recorded evidence: {evidence}",
            "remediation": vulnerability_data.get("solution", "Review the finding details and apply defensive coding standards."),
            "fix_guidance": "Review system headers, input validation schemas, and enforce defense-in-depth principles across backend endpoints.",
            "model_version": "cyvera-expert-v1"
        }

gemini_service = GeminiService()
