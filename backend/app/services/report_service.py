import io
from datetime import datetime, timezone
from typing import Dict, Any, List
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

def generate_pdf_report(scan_data: Dict[str, Any], target_data: Dict[str, Any], findings: List[Dict[str, Any]]) -> bytes:
    """
    Generates a professional executive cybersecurity PDF assessment report.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    story = []
    styles = getSampleStyleSheet()

    # Dark cyber-inspired palette
    PRIMARY = colors.HexColor("#0f172a") # Slate 900
    ACCENT = colors.HexColor("#0284c7")  # Sky 600
    CRITICAL = colors.HexColor("#dc2626") # Red 600
    HIGH = colors.HexColor("#ea580c")     # Orange 600
    MEDIUM = colors.HexColor("#d97706")   # Amber 600
    LOW = colors.HexColor("#2563eb")      # Blue 600
    INFO = colors.HexColor("#64748b")     # Slate 500

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY,
        alignment=TA_LEFT
    )

    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#475569")
    )

    heading2 = ParagraphStyle(
        'Heading2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=PRIMARY,
        spaceBefore=12,
        spaceAfter=6
    )

    body = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#1e293b")
    )

    # Header section
    story.append(Paragraph("CYVERA SECURITY ASSESSMENT REPORT", title_style))
    story.append(Paragraph(f"Authorized Target: <b>{target_data.get('url', 'N/A')}</b> ({target_data.get('name', 'N/A')})", subtitle_style))
    story.append(Paragraph(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')} | Scan ID: {scan_data.get('id', 'N/A')}", subtitle_style))
    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceBefore=1, spaceAfter=15))

    # Executive Score & Overview
    score = scan_data.get("security_score", 100)
    score_color = colors.HexColor("#16a34a") if score >= 80 else (colors.HexColor("#d97706") if score >= 60 else colors.HexColor("#dc2626"))

    score_text = f"<b><font size='22' color='{score_color.hexval()}'>{score} / 100</font></b>"
    
    counts = scan_data.get("severity_breakdown", {})
    if isinstance(counts, dict):
        c_crit = counts.get("critical", 0)
        c_high = counts.get("high", 0)
        c_med = counts.get("medium", 0)
        c_low = counts.get("low", 0)
        c_info = counts.get("informational", 0)
    else:
        c_crit = getattr(counts, "critical", 0)
        c_high = getattr(counts, "high", 0)
        c_med = getattr(counts, "medium", 0)
        c_low = getattr(counts, "low", 0)
        c_info = getattr(counts, "informational", 0)

    summary_data = [
        [Paragraph("<b>Overall Security Posture</b>", body), Paragraph("<b>Vulnerability Findings Breakdown</b>", body)],
        [
            Paragraph(f"{score_text}<br/><br/>Status: <b>{scan_data.get('status', 'Completed').upper()}</b><br/>Scan Type: <b>{scan_data.get('scan_type', 'Passive').capitalize()}</b>", body),
            Paragraph(
                f"• <font color='#dc2626'><b>Critical:</b> {c_crit}</font><br/>"
                f"• <font color='#ea580c'><b>High:</b> {c_high}</font><br/>"
                f"• <font color='#d97706'><b>Medium:</b> {c_med}</font><br/>"
                f"• <font color='#2563eb'><b>Low:</b> {c_low}</font><br/>"
                f"• <font color='#64748b'><b>Informational:</b> {c_info}</font>",
                body
            )
        ]
    ]

    summary_table = Table(summary_data, colWidths=[240, 290])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 15))

    # Findings Detail Table
    story.append(Paragraph("Identified Vulnerability Findings", heading2))

    if not findings:
        story.append(Paragraph("No vulnerabilities discovered during this automated scan session.", body))
    else:
        table_rows = [
            [
                Paragraph("<b>Severity</b>", body),
                Paragraph("<b>Vulnerability / Alert Name</b>", body),
                Paragraph("<b>OWASP Category</b>", body),
                Paragraph("<b>Affected Endpoint</b>", body)
            ]
        ]

        sev_colors = {
            "critical": CRITICAL,
            "high": HIGH,
            "medium": MEDIUM,
            "low": LOW,
            "informational": INFO,
        }

        for f in findings:
            sev = str(f.get("severity", "informational")).lower()
            vuln = f.get("vulnerability", {}) or {}
            v_name = vuln.get("name") or f.get("name", "Security Alert")
            owasp = vuln.get("owasp_category", "A05:2021")
            url = f.get("affected_url", "/")

            badge_color = sev_colors.get(sev, INFO)
            badge_html = f"<font color='{badge_color.hexval()}'><b>{sev.upper()}</b></font>"

            table_rows.append([
                Paragraph(badge_html, body),
                Paragraph(f"<b>{v_name}</b>", body),
                Paragraph(owasp, body),
                Paragraph(f"<font size='8'>{url}</font>", body)
            ])

        findings_table = Table(table_rows, colWidths=[75, 175, 130, 150])
        findings_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f172a")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
            ('PADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(findings_table)

    story.append(Spacer(1, 20))
    story.append(Paragraph("AI-Assisted Security Remediation Guidance", heading2))
    
    # Detail on top findings with AI Guidance
    top_findings = [f for f in findings if f.get("severity") in ("critical", "high", "medium")][:4]
    if not top_findings and findings:
        top_findings = findings[:2]

    for f in top_findings:
        vuln = f.get("vulnerability", {}) or {}
        ai = f.get("ai_analysis", {}) or {}
        v_name = vuln.get("name", "Vulnerability")
        sev = str(f.get("severity", "medium")).upper()
        
        remediation_box = [
            [Paragraph(f"<b>[{sev}] {v_name}</b>", body)],
            [Paragraph(f"<b>Impact & Why It Matters:</b> {ai.get('why_it_matters', vuln.get('description', ''))}", body)],
            [Paragraph(f"<b>Remediation Plan:</b> {ai.get('remediation', vuln.get('solution', ''))}", body)]
        ]
        t = Table(remediation_box, colWidths=[530])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#94a3b8")),
            ('PADDING', (0,0), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(t)
        story.append(Spacer(1, 8))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
