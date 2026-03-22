from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from civicshield_core.utils.http_client import safe_get


class EndpointCrawler:
    def __init__(self, base_url, max_pages=10):
        self.base_url = base_url
        self.domain = urlparse(base_url).netloc
        self.visited = set()
        self.to_visit = [base_url]
        self.endpoints = set()
        self.max_pages = max_pages
        self.headers = {
            "User-Agent": "Mozilla/5.0 (AttackSurfaceScanner)"
        }

    def is_internal(self, url):
        return urlparse(url).netloc == self.domain or urlparse(url).netloc == ""

    def normalize(self, url):
        parsed = urlparse(url)
        return parsed.scheme + "://" + parsed.netloc + parsed.path

    def crawl(self):
        print("[+] Starting endpoint crawl\n")

        ignore_exts = ('.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg', '.gif', '.zip', '.tar', '.gz')

        while self.to_visit and len(self.visited) < self.max_pages:
            url = self.to_visit.pop(0)
            clean_url = self.normalize(url)

            if clean_url in self.visited:
                continue

            print("[*] Crawling:", clean_url)

            if any(clean_url.lower().endswith(ext) for ext in ignore_exts):
                print("[-] Skipping binary file:", clean_url)
                self.visited.add(clean_url)
                self.endpoints.add(clean_url)
                continue

            try:
                response = safe_get(clean_url, headers=self.headers, timeout=(3, 5))
                soup = BeautifulSoup(response.text, "html.parser")
                self.visited.add(clean_url)

                for tag in soup.find_all("a", href=True):
                    link = urljoin(clean_url, tag["href"])
                    link = self.normalize(link)

                    if self.is_internal(link) and link not in self.visited:
                        self.to_visit.append(link)
                        self.endpoints.add(link)

            except Exception as e:
                print("[-] Error:", e)

        print("\n[+] Discovered Endpoints:")
        for ep in sorted(self.endpoints):
            print(" ", ep)

        return self.endpoints


if __name__ == "__main__":
    target = input("Enter target URL (with http/https): ")
    scanner = EndpointCrawler(target)
    scanner.crawl()
