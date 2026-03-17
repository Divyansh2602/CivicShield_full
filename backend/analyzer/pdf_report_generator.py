from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
import datetime

class PDFReportGenerator:
    def generate(self, target, findings):
        filename = "pentest_report.pdf"
        doc = SimpleDocTemplate(filename, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        title = styles["Title"]
        body = styles["Normal"]
        header = styles["Heading2"]

        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

        story.append(Paragraph("Web Application Security Assessment", title))
        story.append(Spacer(1, 12))
        story.append(Paragraph(f"Target: {target}", body))
        story.append(Paragraph(f"Scan Date: {now}", body))
        story.append(Spacer(1, 12))

        story.append(Paragraph("Executive Summary", header))
        story.append(Paragraph(
            "This report documents security vulnerabilities discovered during automated testing. "
            "Critical issues such as SQL Injection, XSS, and Broken Access Control (IDOR) were identified.",
            body
        ))

        story.append(Spacer(1, 20))
        story.append(Paragraph("Findings", header))
        story.append(Spacer(1, 10))

        table_data = [["Risk", "Vulnerability", "URL", "Parameter", "Payload"]]

        for f in findings:
            table_data.append([
                f["risk"],
                f["vuln"],
                f["url"],
                f.get("param", ""),
                f.get("payload", "")
            ])

        table = Table(table_data, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), colors.black),
            ("TEXTCOLOR", (0,0), (-1,0), colors.white),
            ("GRID", (0,0), (-1,-1), 1, colors.grey),
            ("BACKGROUND", (0,1), (-1,-1), colors.whitesmoke),
            ("ALIGN", (0,0), (-1,0), "CENTER"),
        ]))

        story.append(table)
        doc.build(story)

        print("[+] PDF report generated: pentest_report.pdf")
