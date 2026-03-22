from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qs, urljoin
from civicshield_core.utils.http_client import safe_get


class ParameterDiscovery:
    def __init__(self):
        self.parameters = {}

    def extract_get_params(self, url):
        parsed = urlparse(url)
        qs = parse_qs(parsed.query)

        if qs:
            self.parameters[url] = list(qs.keys())

    def extract_post_params(self, html, url):
        soup = BeautifulSoup(html, "html.parser")

        for form in soup.find_all("form"):
            inputs = form.find_all("input")
            names = []

            for item in inputs:
                if item.get("name"):
                    names.append(item.get("name"))

            if names:
                action = form.get("action")
                if action:
                    target_url = urljoin(url, action)
                    self.parameters[target_url] = names
                else:
                    self.parameters[url] = names

    def run(self, endpoints):
        print("\n[+] Discovering parameters")

        for url in endpoints:
            print(f"[*] Discovering params for: {url}")
            try:
                response = safe_get(url, timeout=(3, 5))
                self.extract_get_params(url)
                self.extract_post_params(response.text, url)
                print(f"[+] Done: {url}")
            except Exception as e:
                print(f"[-] Failed: {url} - {str(e)}")

        return self.parameters
