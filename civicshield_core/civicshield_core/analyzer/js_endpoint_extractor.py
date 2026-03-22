import re
from urllib.parse import urljoin
from civicshield_core.utils.http_client import safe_get


class JSEndpointExtractor:
    def __init__(self, base_url):
        self.base_url = base_url
        self.js_files = set()
        self.endpoints = set()
        self.max_js_files = 12
        self.max_js_size = 1_000_000

        self.patterns = [
            r'["\'](/api/[^"\']+)["\']',
            r'["\'](/v[0-9]+/[^"\']+)["\']',
            r'["\'](/auth/[^"\']+)["\']',
            r'["\'](/admin[^"\']*)["\']',
            r'["\'](/login)["\']',
            r'["\'](/register)["\']'
        ]

    def extract_js_files(self, html, page_url):
        matches = re.findall(r'<script[^>]+src=["\'](.*?)["\']', html)
        for src in matches:
            if len(self.js_files) >= self.max_js_files:
                break
            full_js_url = urljoin(page_url, src)
            self.js_files.add(full_js_url)

    def extract_endpoints_from_js(self, js_url):
        try:
            response = safe_get(js_url, timeout=(3, 5))
            content = response.text[: self.max_js_size]
        except Exception:
            return

        for pattern in self.patterns:
            found = re.findall(pattern, content)
            for endpoint in found:
                self.endpoints.add(endpoint)

    def run(self, pages):
        print("[+] Extracting JS endpoints")

        ignore_exts = ('.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg', '.gif', '.zip', '.tar', '.gz')

        for page in pages:
            if len(self.js_files) >= self.max_js_files:
                break
            if any(page.lower().endswith(ext) for ext in ignore_exts):
                continue

            try:
                html = safe_get(page, timeout=(3, 5)).text
            except Exception:
                continue

            self.extract_js_files(html, page)

        for js in list(self.js_files)[: self.max_js_files]:
            self.extract_endpoints_from_js(js)

        return self.endpoints
