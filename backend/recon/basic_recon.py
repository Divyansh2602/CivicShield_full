import socket
from urllib.parse import urlparse
from utils.http_client import safe_get


def basic_recon(target_url):
    recon_data = {}

    print(f"[+] Starting basic recon on {target_url}")

    parsed = urlparse(target_url)
    domain = parsed.netloc

    try:
        ip = socket.gethostbyname(domain)
        recon_data["ip_address"] = ip
    except Exception:
        recon_data["ip_address"] = None

    try:
        response = safe_get(target_url, timeout=(2, 4))
        recon_data["status_code"] = response.status_code
        recon_data["headers"] = dict(response.headers)
    except Exception:
        recon_data["headers"] = {}
        recon_data["status_code"] = None

    server = recon_data["headers"].get("Server", "Unknown")
    powered_by = recon_data["headers"].get("X-Powered-By", "Unknown")

    recon_data["server"] = server
    recon_data["powered_by"] = powered_by

    try:
        robots_url = f"{parsed.scheme}://{domain}/robots.txt"
        robots_resp = safe_get(robots_url, timeout=(2, 4))
        if robots_resp.status_code == 200:
            recon_data["robots_txt"] = robots_resp.text
        else:
            recon_data["robots_txt"] = None
    except Exception:
        recon_data["robots_txt"] = None

    return recon_data
