#!/usr/bin/env python3
"""Standalone keep-warm pinger for CivicShield's API.

Run this on any always-on machine (or as a cron/scheduled job) to keep a
free-tier deployment from cold-starting. This is more reliable than the
in-process self-ping because it survives the API being fully suspended.

Usage:
    python keep_warm.py https://your-api.example.com --interval 600

Or as a one-shot for an external cron (no --interval): pings once and exits.
"""
import argparse
import sys
import time
import urllib.request


def ping(base_url: str) -> bool:
    url = base_url.rstrip("/") + "/health"
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            ok = resp.status == 200
            print(f"[{time.strftime('%H:%M:%S')}] {url} -> {resp.status}")
            return ok
    except Exception as exc:  # noqa: BLE001
        print(f"[{time.strftime('%H:%M:%S')}] {url} -> ERROR: {exc}")
        return False


def main() -> int:
    parser = argparse.ArgumentParser(description="Keep the CivicShield API warm.")
    parser.add_argument("base_url", help="Public base URL of the API")
    parser.add_argument(
        "--interval",
        type=int,
        default=0,
        help="Seconds between pings. 0 = ping once and exit (for external cron).",
    )
    args = parser.parse_args()

    if args.interval <= 0:
        return 0 if ping(args.base_url) else 1

    print(f"Keep-warm loop: {args.base_url} every {args.interval}s (Ctrl-C to stop)")
    try:
        while True:
            ping(args.base_url)
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\nStopped.")
        return 0


if __name__ == "__main__":
    sys.exit(main())
