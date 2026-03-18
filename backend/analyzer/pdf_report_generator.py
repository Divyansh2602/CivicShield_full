from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
import datetime


class PDFReportGenerator:
    def generate(self, target, findings, summary=None, filename="pentest_report.pdf"):
        doc = SimpleDocTemplate(filename, pagesize=A4, leftMargin=32, rightMargin=32, topMargin=32, bottomMargin=32)
        styles = getSampleStyleSheet()
        story = []

        title = styles["Title"]
        body = styles["BodyText"]
        header = styles["Heading2"]
        subheader = styles["Heading3"]
        small = ParagraphStyle("Small", parent=body, fontSize=9, leading=12)

        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        summary = summary or {}
        severity_counts = summary.get("severity_counts", {})

        story.append(Paragraph("CivicShield Security Assessment Report", title))
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"<b>Target:</b> {target}", body))
        story.append(Paragraph(f"<b>Scan Date:</b> {now}", body))
        story.append(Paragraph("<b>Assessment Type:</b> Automated web reconnaissance, parameter testing, and phishing risk analysis support", body))
        story.append(Spacer(1, 16))

        story.append(Paragraph("Executive Summary", header))
        story.append(Paragraph(
            "This report summarizes the results of an automated security assessment focused on endpoint discovery, parameter analysis, and common web exploitation patterns. "
            "The output is intended to support triage and prioritization, not replace a full manual penetration test.",
            body,
        ))
        story.append(Spacer(1, 10))

        overview_rows = [
            ["Pages Crawled", str(summary.get("pages_crawled", 0)), "Endpoints Discovered", str(summary.get("total_endpoints", 0))],
            ["Parameters Found", str(summary.get("parameters_discovered", 0)), "Payloads Tested", str(summary.get("payloads_tested", 0))],
            ["Confirmed Findings", str(summary.get("confirmed_findings", len(findings))), "Requests Made", str(summary.get("requests_made", 0))],
            ["Critical", str(severity_counts.get("critical", 0)), "High", str(severity_counts.get("high", 0))],
        ]
        overview = Table(overview_rows, colWidths=[110, 70, 130, 70])
        overview.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.whitesmoke),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
            ("PADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(overview)
        story.append(Spacer(1, 16))

        story.append(Paragraph("Finding Summary", header))
        table_data = [["Risk", "Vulnerability", "Parameter", "Method", "Remediation"]]
        for finding in findings[:12]:
            table_data.append([
                finding.get("risk", "-"),
                finding.get("vuln", "-"),
                finding.get("param", "-"),
                finding.get("method", "-"),
                finding.get("remediation", "Review server-side validation and access controls."),
            ])
        summary_table = Table(table_data, colWidths=[48, 72, 72, 46, 250], repeatRows=1)
        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.black),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 1), (-1, -1), colors.whitesmoke),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("LEADING", (0, 0), (-1, -1), 10),
            ("PADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 16))

        story.append(Paragraph("Detailed Findings", header))
        if not findings:
            story.append(Paragraph("No confirmed vulnerabilities were detected during the automated scan.", body))
        else:
            for index, finding in enumerate(findings, start=1):
                story.append(Paragraph(f"{index}. {finding.get('vuln', 'Unknown')} ({finding.get('risk', 'LOW')})", subheader))
                story.append(Paragraph(f"<b>Target:</b> {finding.get('url', '-')}", small))
                story.append(Paragraph(f"<b>Parameter:</b> {finding.get('param', '-')}", small))
                story.append(Paragraph(f"<b>Method:</b> {finding.get('method', '-')}", small))
                story.append(Paragraph(f"<b>Detection Signal:</b> {finding.get('signal', 'Automated finding pattern matched')}", small))
                story.append(Paragraph(f"<b>Evidence:</b> {finding.get('evidence', 'N/A')}", small))
                story.append(Paragraph(f"<b>Recommended Fix:</b> {finding.get('remediation', 'Validate inputs and harden the affected endpoint.')}", small))
                story.append(Spacer(1, 10))

        doc.build(story)
        print(f"[+] PDF report generated: {filename}")
