# ===================================================
# CivicShield AI — PDF report service
# Generates a per-scan PDF directly (no shared fixed filename → no race).
# ===================================================
import datetime
import os
import tempfile
from typing import Dict, List

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

_RISK_COLORS = {
    "CRITICAL": colors.HexColor("#ff5470"),
    "HIGH": colors.HexColor("#ff8f4d"),
    "MEDIUM": colors.HexColor("#d9a300"),
    "LOW": colors.HexColor("#12b98c"),
}


def generate_report(scan_id: int, target: str, findings: List[Dict]) -> str:
    """Render a PDF for a scan into a unique temp file and return its path.

    The caller is responsible for streaming and deleting the file.
    """
    fd, path = tempfile.mkstemp(prefix=f"civicshield_report_{scan_id}_", suffix=".pdf")
    os.close(fd)

    doc = SimpleDocTemplate(path, pagesize=A4, title=f"CivicShield Report #{scan_id}")
    styles = getSampleStyleSheet()
    story = []

    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    story.append(Paragraph("Web Application Security Assessment", styles["Title"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"Target: {target}", styles["Normal"]))
    story.append(Paragraph(f"Scan ID: {scan_id}", styles["Normal"]))
    story.append(Paragraph(f"Generated: {now}", styles["Normal"]))
    story.append(Spacer(1, 12))

    story.append(Paragraph("Executive Summary", styles["Heading2"]))
    story.append(
        Paragraph(
            f"This report documents {len(findings)} security finding(s) discovered "
            "during automated testing, including SQL Injection, Cross-Site Scripting "
            "(XSS), and Broken Access Control (IDOR).",
            styles["Normal"],
        )
    )
    story.append(Spacer(1, 20))

    story.append(Paragraph("Findings", styles["Heading2"]))
    story.append(Spacer(1, 10))

    table_data = [["Risk", "Vulnerability", "URL", "Parameter", "Payload"]]
    for f in findings:
        table_data.append(
            [
                str(f.get("risk", "")),
                str(f.get("vuln", f.get("vuln_type", ""))),
                str(f.get("url", "")),
                str(f.get("param", "")),
                str(f.get("payload", "")),
            ]
        )

    table = Table(table_data, repeatRows=1, colWidths=[55, 75, 170, 70, 110])
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0c1119")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 1), (-1, -1), colors.whitesmoke),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
    ]
    # Color-code the risk cell per row.
    for row_idx, f in enumerate(findings, start=1):
        risk = str(f.get("risk", "")).upper()
        if risk in _RISK_COLORS:
            style.append(("TEXTCOLOR", (0, row_idx), (0, row_idx), _RISK_COLORS[risk]))
    table.setStyle(TableStyle(style))

    story.append(table)
    doc.build(story)
    return path
