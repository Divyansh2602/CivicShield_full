import argparse
import json
import sys
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

    try:
        with urllib.request.urlopen(request, timeout=args.timeout) as response:
            body = response.read().decode("utf-8")
            payload = json.loads(body)
            print(f"Ping succeeded: {response.status} {payload}")
            return 0
    except urllib.error.HTTPError as exc:
        print(f"Ping failed with HTTP {exc.code}: {exc.reason}", file=sys.stderr)
        return 1
    except urllib.error.URLError as exc:
        print(f"Ping failed: {exc.reason}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
