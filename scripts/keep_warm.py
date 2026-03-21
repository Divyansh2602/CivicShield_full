import argparse
import json
import sys
import time
import urllib.error
import urllib.request


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Ping a backend health endpoint so the service stays warm."
    )
    parser.add_argument(
        "--base-url",
        required=True,
        help="Backend base URL, for example https://your-backend.onrender.com",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=20,
        help="Request timeout in seconds.",
    )
    args = parser.parse_args()

    url = f"{args.base_url.rstrip('/')}/healthz"
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "civicshield-keep-warm/1.0",
            "Accept": "application/json",
        },
    )

    max_retries = 12
    retry_delay = 10

    for attempt in range(1, max_retries + 1):
        try:
            with urllib.request.urlopen(request, timeout=args.timeout) as response:
                body = response.read().decode("utf-8")
                payload = json.loads(body)
                print(f"Ping succeeded on attempt {attempt}: {response.status} {payload}")
                return 0
        except urllib.error.HTTPError as exc:
            if exc.code == 503 and attempt < max_retries:
                print(f"Attempt {attempt} failed with 503 Service Unavailable. Retrying in {retry_delay}s...", file=sys.stderr)
                time.sleep(retry_delay)
                continue
            
            print(f"Ping failed (HTTP {exc.code}): {exc.reason}", file=sys.stderr)
            return 1
        except urllib.error.URLError as exc:
            if attempt < max_retries:
                print(f"Attempt {attempt} failed ({exc.reason}). Retrying in {retry_delay}s...", file=sys.stderr)
                time.sleep(retry_delay)
                continue
                
            print(f"Ping failed completely: {exc.reason}", file=sys.stderr)
            return 1
    
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
