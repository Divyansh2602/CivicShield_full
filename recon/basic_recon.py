import requests
import socket
from urllib.parse import urlparse

def basic_recon(target_url):
    recon_data = {}

    print(f"[+] Starting basic recon on {target_url}")

    # Parse domain
    parsed = urlparse(target_url)
    domain = parsed.netloc

    # 1️⃣ IP Resolution
    try:
        ip = socket.gethostbyname(domain)
        recon_data["ip_address"] = ip
    except Exception as e:
        recon_data["ip_address"] = None

    # 2️⃣ HTTP Headers
    try:
        response = requests.get(target_url, timeout=(2, 2))
        recon_data["status_code"] = response.status_code
        recon_data["headers"] = dict(response.headers)
    except Exception as e:
        recon_data["headers"] = {}
        recon_data["status_code"] = None

    # 3️⃣ Technology Guessing (very basic)
    server = recon_data["headers"].get("Server", "Unknown")
    powered_by = recon_data["headers"].get("X-Powered-By", "Unknown")

    recon_data["server"] = server
    recon_data["powered_by"] = powered_by

    # 4️⃣ robots.txt
    try:
        robots_url = f"{parsed.scheme}://{domain}/robots.txt"
        robots_resp = requests.get(robots_url, timeout=(2, 2))
        if robots_resp.status_code == 200:
            recon_data["robots_txt"] = robots_resp.text
        else:
            recon_data["robots_txt"] = None
    except:
        recon_data["robots_txt"] = None

    return recon_data
