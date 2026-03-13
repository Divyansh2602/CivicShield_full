import html as html_lib
import datetime
from collections import Counter

class ReportGenerator:
    def generate(self, target, findings):
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

        risks = [f["risk"] for f in findings]
        stats = Counter(risks)

        html = f"""
        <html>
        <head>
            <title>Web Application Security Report</title>
            <style>
                body {{ font-family: Arial; background:#0e0e0e; color:#eaeaea; padding:20px; }}
                h1, h2 {{ color:#ff4d4d; }}
                table {{ width:100%; border-collapse: collapse; margin-top:20px; }}
                th, td {{ padding:10px; border:1px solid #333; }}
                th {{ background:#1e1e1e; }}
                .CRITICAL {{ color:#ff3333; }}
                .HIGH {{ color:#ff9933; }}
                .MEDIUM {{ color:#ffdd55; }}
                .LOW {{ color:#66ff66; }}
                .box {{ background:#1b1b1b; padding:15px; margin-top:20px; border-radius:8px; }}
                .evidence {{ font-family: monospace; background:#000; padding:10px; border-radius:5px; color:#9f9; }}
            </style>
        </head>
        <body>

        <h1>Web Application Security Assessment</h1>
        <div class="box">
            <b>Target:</b> {target}<br>
            <b>Scan Date:</b> {now}<br>
            <b>Total Issues:</b> {len(findings)}
        </div>

        <h2>Executive Summary</h2>
        <div class="box">
            This automated security assessment discovered multiple security vulnerabilities
            including SQL Injection, Cross-Site Scripting (XSS), and Broken Access Control (IDOR).
            These issues may allow attackers to access or manipulate sensitive application data.
        </div>

        <h2>Risk Overview</h2>
        <div class="box">
            CRITICAL: {stats.get("CRITICAL", 0)}<br>
            HIGH: {stats.get("HIGH", 0)}<br>
            MEDIUM: {stats.get("MEDIUM", 0)}<br>
            LOW: {stats.get("LOW", 0)}
        </div>

        <h2>Findings</h2>
        <table>
            <tr>
                <th>Risk</th>
                <th>Vulnerability</th>
                <th>URL</th>
                <th>Parameter</th>
                <th>Payload</th>
                <th>Evidence</th>
            </tr>
        """

        for f in findings:
            html += f"""
            <tr>
                <td class="{f['risk']}">{f['risk']}</td>
                <td>{f['vuln']}</td>
                <td>{f['url']}</td>
                <td>{f.get('param', '')}</td>
                <td><div class="evidence">{html_lib.escape(f.get('payload',''))}</div></td>
                <td><div class="evidence">{html_lib.escape(f.get('evidence',''))}</div></td>

            </tr>
            """

        html += """
        </table>
        </body>
        </html>
        """

        with open("report.html", "w", encoding="utf-8") as f:
            f.write(html)

        print("[+] Professional pentest report generated: report.html")
