from urllib.parse import urlparse
from civicshield_core.utils.http_client import safe_get


class PassiveSecurityAnalyzer:
    def __init__(self):
        self.request_timeout = (4, 6)
        self.header_rules = [
            {
                "header": "content-security-policy",
                "vuln": "Missing CSP",
                "risk": "MEDIUM",
                "signal": "Response is missing a Content-Security-Policy header",
                "remediation": "Add a strict Content-Security-Policy header to reduce XSS impact and third-party script abuse.",
            },
            {
                "header": "x-frame-options",
                "vuln": "Missing Clickjacking Protection",
                "risk": "MEDIUM",
                "signal": "Response is missing an X-Frame-Options header",
                "remediation": "Set X-Frame-Options to DENY or SAMEORIGIN to mitigate clickjacking risks.",
            },
            {
                "header": "x-content-type-options",
                "vuln": "Missing MIME Sniffing Protection",
                "risk": "LOW",
                "signal": "Response is missing X-Content-Type-Options: nosniff",
                "remediation": "Set X-Content-Type-Options to nosniff to prevent browsers from MIME type sniffing.",
            },
        ]

    def _safe_get(self, url: str):
        try:
            return safe_get(url, timeout=self.request_timeout)
        except Exception as exc:
            print(f"[-] Passive analyzer request failed for {url}: {exc}")
            return None

    def _build_finding(self, vuln: str, risk: str, url: str, signal: str, evidence: str, remediation: str, param: str = "-"):
        return {
            "vuln": vuln,
            "risk": risk,
            "url": url,
            "param": param,
            "payload": "Passive analysis",
            "evidence": evidence[:240],
            "method": "GET",
            "signal": signal,
            "remediation": remediation,
        }

    def analyze(self, target: str, endpoints):
        findings = []
        seen = set()
        candidate_urls = [target] + list(endpoints)[:10]

        for url in candidate_urls:
            response = self._safe_get(url)
            if not response:
                continue

            headers = {k.lower(): v for k, v in response.headers.items()}
            body = response.text.lower()
            parsed = urlparse(str(response.url))
            is_https = parsed.scheme == "https"
            body_is_html = "text/html" in headers.get("content-type", "")

            for rule in self.header_rules:
                if rule["header"] not in headers:
                    key = (rule["vuln"], str(response.url))
                    if key in seen:
                        continue
                    seen.add(key)
                    findings.append(
                        self._build_finding(
                            vuln=rule["vuln"],
                            risk=rule["risk"],
                            url=str(response.url),
                            signal=rule["signal"],
                            evidence=f"Observed headers: {', '.join(sorted(headers.keys())[:12]) or 'none'}",
                            remediation=rule["remediation"],
                        )
                    )

            if is_https and "strict-transport-security" not in headers:
                key = ("Missing HSTS", str(response.url))
                if key not in seen:
                    seen.add(key)
                    findings.append(
                        self._build_finding(
                            vuln="Missing HSTS",
                            risk="LOW",
                            url=str(response.url),
                            signal="HTTPS endpoint is missing a Strict-Transport-Security header",
                            evidence=f"Final URL used HTTPS and returned headers without HSTS from {response.url}",
                            remediation="Enable Strict-Transport-Security with an appropriate max-age to enforce HTTPS on repeat visits.",
                        )
                    )

            if not is_https and any(keyword in str(response.url).lower() for keyword in ["login", "signin", "account", "auth"]):
                key = ("Insecure Authentication Surface", str(response.url))
                if key not in seen:
                    seen.add(key)
                    findings.append(
                        self._build_finding(
                            vuln="Insecure Authentication Surface",
                            risk="HIGH",
                            url=str(response.url),
                            signal="Authentication-related page is reachable without HTTPS",
                            evidence=f"Authentication-like endpoint served over HTTP: {response.url}",
                            remediation="Serve all authentication and account flows exclusively over HTTPS and redirect all HTTP requests.",
                        )
                    )

            if body_is_html and any(keyword in body for keyword in ["<form", "password", "signin", "login"]):
                if not is_https:
                    key = ("Form Over HTTP", str(response.url))
                    if key not in seen:
                        seen.add(key)
                        findings.append(
                            self._build_finding(
                                vuln="Form Over HTTP",
                                risk="HIGH",
                                url=str(response.url),
                                signal="Interactive form or credential surface appears on a non-HTTPS page",
                                evidence=f"Detected HTML form or password indicators on non-HTTPS page {response.url}",
                                remediation="Move all interactive forms and credential collection pages to HTTPS-only delivery.",
                            )
                        )

        return findings
