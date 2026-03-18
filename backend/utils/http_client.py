import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

DEFAULT_HEADERS = {
    "User-Agent": "CivicShield/1.0",
}


def safe_request(method: str, url: str, timeout=(3, 3), headers=None, **kwargs):
    merged_headers = {**DEFAULT_HEADERS, **(headers or {})}
    try:
        return requests.request(method, url, timeout=timeout, headers=merged_headers, verify=True, **kwargs)
    except requests.exceptions.SSLError:
        return requests.request(method, url, timeout=timeout, headers=merged_headers, verify=False, **kwargs)


def safe_get(url: str, timeout=(3, 3), headers=None, **kwargs):
    return safe_request("GET", url, timeout=timeout, headers=headers, **kwargs)
