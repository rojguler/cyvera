import sys
import json
import time
import requests
import sqlite3
from pathlib import Path

BASE_BACKEND = "http://localhost:8000"
BASE_TARGET = "http://localhost:5000"
BASE_FRONTEND = "http://localhost:5173"

def run_e2e_verification():
    results = {}
    print("=== STARTING CYVERA RIGOROUS END-TO-END INTEGRATION TEST ===")

    # 1. Start / Verify Vulnerable Target App
    try:
        r = requests.get(BASE_TARGET, timeout=5)
        if r.status_code == 200 and "Insecure Demo Portal" in r.text:
            results["1_target_app"] = {"status": "PASS", "details": f"Status 200 OK. Response length: {len(r.text)}"}
        else:
            results["1_target_app"] = {"status": "FAIL", "details": f"Unexpected response: {r.status_code}"}
    except Exception as e:
        results["1_target_app"] = {"status": "FAIL", "error": str(e)}

    # 2. Start / Verify FastAPI Backend
    try:
        r = requests.get(f"{BASE_BACKEND}/api/docs", timeout=5)
        if r.status_code == 200 and "Swagger UI" in r.text:
            results["2_backend"] = {"status": "PASS", "details": f"Swagger UI accessible on {BASE_BACKEND}/api/docs"}
        else:
            results["2_backend"] = {"status": "FAIL", "details": f"Status: {r.status_code}"}
    except Exception as e:
        results["2_backend"] = {"status": "FAIL", "error": str(e)}

    # 3. Start / Verify React Frontend
    try:
        r = requests.get(BASE_FRONTEND, timeout=5)
        if r.status_code == 200 and "Cyvera" in r.text:
            results["3_frontend"] = {"status": "PASS", "details": f"Vite React frontend serving index.html on {BASE_FRONTEND}"}
        else:
            results["3_frontend"] = {"status": "FAIL", "details": f"Status: {r.status_code}"}
    except Exception as e:
        results["3_frontend"] = {"status": "FAIL", "error": str(e)}

    # 4. Log into Cyvera
    auth_token = None
    try:
        login_payload = {"username": "secops_demo", "password": "CyveraSecurity2025!"}
        r = requests.post(f"{BASE_BACKEND}/api/v1/auth/login", json=login_payload, timeout=5)
        if r.status_code == 200:
            data = r.json()
            auth_token = data.get("access_token")
            results["4_login"] = {"status": "PASS", "user": data.get("user"), "token_type": data.get("token_type")}
        else:
            results["4_login"] = {"status": "FAIL", "status_code": r.status_code, "body": r.text}
    except Exception as e:
        results["4_login"] = {"status": "FAIL", "error": str(e)}

    if not auth_token:
        print("Login failed, aborting further steps.")
        print(json.dumps(results, indent=2))
        return results

    headers = {"Authorization": f"Bearer {auth_token}"}

    # 5. Add Target (http://localhost:5000)
    target_id = None
    try:
        target_payload = {
            "name": f"Local Insecure Flask App ({int(time.time())})",
            "url": BASE_TARGET,
            "description": "Local test target for automated end-to-end verification"
        }
        r = requests.post(f"{BASE_BACKEND}/api/v1/targets", json=target_payload, headers=headers, timeout=5)
        if r.status_code == 201:
            target_data = r.json()
            target_id = target_data.get("id")
            results["5_add_target"] = {"status": "PASS", "target_id": target_id, "url": target_data.get("url")}
        else:
            results["5_add_target"] = {"status": "FAIL", "status_code": r.status_code, "body": r.text}
    except Exception as e:
        results["5_add_target"] = {"status": "FAIL", "error": str(e)}

    # 6. Run Quick Passive Scan
    passive_scan_id = None
    try:
        scan_payload = {"target_id": target_id, "scan_type": "passive"}
        r = requests.post(f"{BASE_BACKEND}/api/v1/scans", json=scan_payload, headers=headers, timeout=5)
        if r.status_code == 201:
            passive_scan_id = r.json().get("id")
            # Wait for completion
            for _ in range(20):
                time.sleep(1)
                sr = requests.get(f"{BASE_BACKEND}/api/v1/scans/{passive_scan_id}", headers=headers, timeout=5)
                s_data = sr.json()
                if s_data.get("status") in ("completed", "failed"):
                    break
            
            results["6_passive_scan"] = {
                "status": "PASS" if s_data.get("status") == "completed" else "FAIL",
                "scan_id": passive_scan_id,
                "scan_status": s_data.get("status"),
                "security_score": s_data.get("security_score"),
                "findings_count": len(s_data.get("findings", [])),
                "findings_summary": [{
                    "severity": f.get("severity"),
                    "vuln_name": f.get("vulnerability", {}).get("name") if f.get("vulnerability") else None,
                    "owasp": f.get("vulnerability", {}).get("owasp_category") if f.get("vulnerability") else None,
                    "cwe": f.get("vulnerability", {}).get("cwe_id") if f.get("vulnerability") else None
                } for f in s_data.get("findings", [])]
            }
        else:
            results["6_passive_scan"] = {"status": "FAIL", "status_code": r.status_code, "body": r.text}
    except Exception as e:
        results["6_passive_scan"] = {"status": "FAIL", "error": str(e)}

    # 7. Run Full Active Scan
    active_scan_id = None
    try:
        scan_payload = {"target_id": target_id, "scan_type": "full"}
        r = requests.post(f"{BASE_BACKEND}/api/v1/scans", json=scan_payload, headers=headers, timeout=5)
        if r.status_code == 201:
            active_scan_id = r.json().get("id")
            # Wait for completion
            for _ in range(20):
                time.sleep(1)
                sr = requests.get(f"{BASE_BACKEND}/api/v1/scans/{active_scan_id}", headers=headers, timeout=5)
                s_data = sr.json()
                if s_data.get("status") in ("completed", "failed"):
                    break
            
            results["7_full_active_scan"] = {
                "status": "PASS" if s_data.get("status") == "completed" else "FAIL",
                "scan_id": active_scan_id,
                "scan_status": s_data.get("status"),
                "security_score": s_data.get("security_score"),
                "findings_count": len(s_data.get("findings", [])),
                "findings_summary": [{
                    "id": f.get("id"),
                    "severity": f.get("severity"),
                    "vuln_name": f.get("vulnerability", {}).get("name") if f.get("vulnerability") else None,
                    "owasp": f.get("vulnerability", {}).get("owasp_category") if f.get("vulnerability") else None,
                    "cwe": f.get("vulnerability", {}).get("cwe_id") if f.get("vulnerability") else None
                } for f in s_data.get("findings", [])]
            }
        else:
            results["7_full_active_scan"] = {"status": "FAIL", "status_code": r.status_code, "body": r.text}
    except Exception as e:
        results["7_full_active_scan"] = {"status": "FAIL", "error": str(e)}

    # 8. Check ZAP connection vs Fallback
    try:
        zap_check_res = requests.get("http://localhost:8080/JSON/core/view/version/", headers={"X-ZAP-API-Key": "cyvera-zap-internal-api-key"}, timeout=2)
        zap_online = (zap_check_res.status_code == 200)
    except Exception:
        zap_online = False

    results["8_zap_verification"] = {
        "zap_daemon_running_on_8080": zap_online,
        "mode_used": "OWASP ZAP Live Daemon" if zap_online else "Live HTTP Response & Header Security Analyzer (Fallback Engine)"
    }

    # 9. Verify Deterministic Score & Findings Normalization
    try:
        # Check active scan findings scoring
        if active_scan_id:
            sr = requests.get(f"{BASE_BACKEND}/api/v1/scans/{active_scan_id}", headers=headers, timeout=5)
            s_data = sr.json()
            score = s_data.get("security_score")
            findings = s_data.get("findings", [])
            
            # Check OWASP / CWE
            has_cwe = all(f.get("vulnerability", {}).get("cwe_id") is not None for f in findings if f.get("vulnerability"))
            has_owasp = all(f.get("vulnerability", {}).get("owasp_category") is not None for f in findings if f.get("vulnerability"))
            
            results["9_normalization_and_scoring"] = {
                "status": "PASS" if (has_cwe and has_owasp and 0 <= score <= 100) else "FAIL",
                "calculated_score": score,
                "all_mapped_to_cwe": has_cwe,
                "all_mapped_to_owasp": has_owasp,
                "findings_count": len(findings)
            }
    except Exception as e:
        results["9_normalization_and_scoring"] = {"status": "FAIL", "error": str(e)}

    # 10. Database direct persistence check (sqlite3)
    try:
        conn = sqlite3.connect("cyvera.db")
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM targets WHERE id = ?", (target_id,))
        target_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM scans WHERE id = ?", (active_scan_id,))
        scan_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM scan_findings WHERE scan_id = ?", (active_scan_id,))
        findings_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM vulnerabilities")
        vuln_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM ai_analyses")
        ai_count = cursor.fetchone()[0]

        conn.close()

        results["10_database_persistence"] = {
            "status": "PASS" if (target_count > 0 and scan_count > 0 and findings_count > 0) else "FAIL",
            "target_persisted": target_count > 0,
            "scan_persisted": scan_count > 0,
            "findings_in_db_for_scan": findings_count,
            "total_vulnerabilities_in_db": vuln_count,
            "total_ai_analyses_in_db": ai_count
        }
    except Exception as e:
        results["10_database_persistence"] = {"status": "FAIL", "error": str(e)}

    # 11. Trigger Gemini Analysis on a Finding
    try:
        if active_scan_id:
            sr = requests.get(f"{BASE_BACKEND}/api/v1/scans/{active_scan_id}", headers=headers, timeout=5)
            findings = sr.json().get("findings", [])
            if findings:
                test_finding_id = findings[0]["id"]
                # Test AI trigger
                ar = requests.post(f"{BASE_BACKEND}/api/v1/ai/analyze/{test_finding_id}", headers=headers, timeout=30)
                if ar.status_code == 200:
                    ai_data = ar.json()
                    results["11_gemini_ai_analysis"] = {
                        "status": "PASS",
                        "finding_id": test_finding_id,
                        "model_version": ai_data.get("model_version"),
                        "explanation_length": len(ai_data.get("explanation", "")),
                        "has_fix_guidance": bool(ai_data.get("fix_guidance")),
                        "sample_explanation": ai_data.get("explanation", "")[:150] + "...",
                        "sample_fix": ai_data.get("fix_guidance", "")[:150] + "..."
                    }
                else:
                    results["11_gemini_ai_analysis"] = {"status": "FAIL", "status_code": ar.status_code, "body": ar.text}
    except Exception as e:
        results["11_gemini_ai_analysis"] = {"status": "FAIL", "error": str(e)}

    # 12. Generate PDF Report
    try:
        if active_scan_id:
            pr = requests.get(f"{BASE_BACKEND}/api/v1/reports/scans/{active_scan_id}/pdf", headers=headers, timeout=10)
            if pr.status_code == 200 and pr.headers.get("content-type") == "application/pdf":
                pdf_bytes = pr.content
                results["12_pdf_generation"] = {
                    "status": "PASS",
                    "content_type": pr.headers.get("content-type"),
                    "pdf_size_bytes": len(pdf_bytes),
                    "is_valid_pdf_header": pdf_bytes.startswith(b"%PDF-")
                }
            else:
                results["12_pdf_generation"] = {"status": "FAIL", "status_code": pr.status_code, "headers": dict(pr.headers)}
    except Exception as e:
        results["12_pdf_generation"] = {"status": "FAIL", "error": str(e)}

    # 13. Verify Scan History & Dashboard Stats
    try:
        dr = requests.get(f"{BASE_BACKEND}/api/v1/dashboard/stats", headers=headers, timeout=5)
        hr = requests.get(f"{BASE_BACKEND}/api/v1/scans", headers=headers, timeout=5)
        
        if dr.status_code == 200 and hr.status_code == 200:
            stats = dr.json()
            history = hr.json()
            results["13_dashboard_and_history"] = {
                "status": "PASS",
                "total_scans_recorded": stats.get("total_scans"),
                "total_targets_recorded": stats.get("total_targets"),
                "total_vulnerabilities": stats.get("total_vulnerabilities"),
                "average_security_score": stats.get("average_security_score"),
                "history_scans_count": len(history)
            }
        else:
            results["13_dashboard_and_history"] = {"status": "FAIL", "dashboard_code": dr.status_code, "history_code": hr.status_code}
    except Exception as e:
        results["13_dashboard_and_history"] = {"status": "FAIL", "error": str(e)}

    print(json.dumps(results, indent=2))
    return results

if __name__ == "__main__":
    run_e2e_verification()
