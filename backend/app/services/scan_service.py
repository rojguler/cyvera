import logging
import threading
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.scan import Scan
from app.models.target import Target
from app.models.vulnerability import Vulnerability
from app.models.scan_finding import ScanFinding
from app.models.ai_analysis import AIAnalysis
from app.services.zap_service import zap_service
from app.services.finding_parser import parse_zap_alert
from app.services.scoring_engine import calculate_security_score
from app.services.gemini_service import gemini_service

logger = logging.getLogger(__name__)

def execute_scan_background(scan_id: str):
    """
    Executes a security scan in the background (via thread or Celery worker),
    interfacing with ZAP or fallback live HTTP analyzer, scoring findings, and saving results.
    """
    db: Session = SessionLocal()
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            logger.error(f"Scan {scan_id} not found for background execution")
            return

        target = db.query(Target).filter(Target.id == scan.target_id).first()
        if not target:
            scan.status = "failed"
            scan.error_message = "Associated target not found"
            db.commit()
            return

        scan.status = "running"
        scan.started_at = datetime.now(timezone.utc)
        scan.progress = 10
        db.commit()

        target_url = target.url
        raw_alerts = []

        # Check if ZAP is connected
        if zap_service.is_connected():
            scan.scan_engine = "zap"
            scan.progress = 25
            db.commit()
            
            # 1. Spider phase
            spider_id = zap_service.start_spider(target_url)
            if spider_id:
                scan.progress = 40
                db.commit()
                # Wait for spider (with timeout)
                for _ in range(20):
                    p = zap_service.get_spider_status(spider_id)
                    scan.progress = 40 + int(p * 0.2) # 40-60%
                    db.commit()
                    if p >= 100:
                        break
                    import time; time.sleep(1)

            # 2. Active scan phase (if requested)
            if scan.scan_type in ("active", "full"):
                scan.progress = 65
                db.commit()
                ascan_id = zap_service.start_active_scan(target_url)
                if ascan_id:
                    for _ in range(40):
                        p = zap_service.get_active_scan_status(ascan_id)
                        scan.progress = 65 + int(p * 0.2) # 65-85%
                        db.commit()
                        if p >= 100:
                            break
                        import time; time.sleep(1)

            scan.progress = 85
            db.commit()
            raw_alerts = zap_service.get_alerts(target_url)

        else:
            # Live HTTP Fallback scan engine (real inspection of target headers, cookies, and injection responses)
            scan.scan_engine = "fallback"
            scan.progress = 40
            db.commit()
            import time; time.sleep(1.5)
            scan.progress = 75
            db.commit()
            raw_alerts = zap_service.run_live_http_fallback_scan(target_url, scan.scan_type)

        # 3. Parse and normalize findings
        scan.progress = 90
        db.commit()

        parsed_items = []
        for raw_alert in raw_alerts:
            parsed = parse_zap_alert(raw_alert)
            parsed_items.append(parsed)

        # 4. Compute deterministic security score
        finding_dicts = [p["finding"] for p in parsed_items]
        scoring_res = calculate_security_score(finding_dicts)
        scan.security_score = scoring_res["score"]

        # 5. Persist vulnerabilities and findings in DB
        for item in parsed_items:
            v_data = item["vulnerability"]
            f_data = item["finding"]

            # Upsert canonical vulnerability definition
            vuln = db.query(Vulnerability).filter(Vulnerability.plugin_id == v_data["plugin_id"]).first()
            if not vuln:
                vuln = Vulnerability(
                    plugin_id=v_data["plugin_id"],
                    name=v_data["name"],
                    description=v_data["description"],
                    solution=v_data["solution"],
                    reference=v_data["reference"],
                    owasp_category=v_data["owasp_category"],
                    cwe_id=v_data["cwe_id"],
                    wasc_id=v_data["wasc_id"]
                )
                db.add(vuln)
                db.flush()

            # Create scan finding instance
            finding = ScanFinding(
                scan_id=scan.id,
                vulnerability_id=vuln.id,
                severity=f_data["severity"],
                risk_score=f_data["risk_score"],
                confidence=f_data["confidence"],
                affected_url=f_data["affected_url"],
                http_method=f_data["http_method"],
                parameter=f_data["parameter"],
                attack=f_data["attack"],
                evidence=f_data["evidence"],
                other_info=f_data["other_info"]
            )
            db.add(finding)
            db.flush()

            # Automatically pre-generate AI analysis for top severe findings (critical & high)
            if f_data["severity"] in ("critical", "high"):
                try:
                    ai_res = gemini_service.analyze_finding(f_data, v_data)
                    ai_analysis = AIAnalysis(
                        finding_id=finding.id,
                        explanation=ai_res["explanation"],
                        why_it_matters=ai_res["why_it_matters"],
                        potential_impact=ai_res["potential_impact"],
                        evidence_interpretation=ai_res["evidence_interpretation"],
                        remediation=ai_res["remediation"],
                        fix_guidance=ai_res["fix_guidance"],
                        model_version=ai_res.get("model_version", "gemini-2.0-flash")
                    )
                    db.add(ai_analysis)
                except Exception as e:
                    logger.warning(f"Failed to auto-generate AI analysis for finding {finding.id}: {e}")

        scan.status = "completed"
        scan.progress = 100
        scan.completed_at = datetime.now(timezone.utc)
        db.commit()

    except Exception as e:
        logger.exception(f"Scan {scan_id} execution encountered an error: {e}")
        try:
            scan = db.query(Scan).filter(Scan.id == scan_id).first()
            if scan:
                scan.status = "failed"
                scan.error_message = str(e)
                db.commit()
        except Exception:
            pass
    finally:
        db.close()

def launch_scan_job(scan_id: str):
    """Launches scan job asynchronously in a background worker thread."""
    thread = threading.Thread(target=execute_scan_background, args=(scan_id,), daemon=True)
    thread.start()
