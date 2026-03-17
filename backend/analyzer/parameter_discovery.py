import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qs

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

            for i in inputs:
                if i.get("name"):
                    names.append(i.get("name"))

            if names:
                action = form.get("action")
                if action:
                    from urllib.parse import urljoin
                    target_url = urljoin(url, action)
                    self.parameters[target_url] = names
                else:
                    self.parameters[url] = names

    def run(self, endpoints):
        print("\n[+] Discovering parameters")

        for url in endpoints:
            print(f"[*] Discovering params for: {url}")
            try:
                r = requests.get(url, timeout=(2, 2))
                self.extract_get_params(url)
                self.extract_post_params(r.text, url)
                print(f"[+] Done: {url}")
            except Exception as e:
                print(f"[-] Failed: {url} - {str(e)}")

        return self.parameters
