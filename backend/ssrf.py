# ===================================================
# CivicShield AI - SSRF Guard
# ---------------------------------------------------
# Prevents the scanner from being pointed at internal
# infrastructure (loopback, private LAN, link-local
# cloud-metadata endpoints, etc.). Every /scan target
# is validated here BEFORE any request is made.
# ===================================================

from __future__ import annotations

import ipaddress
import os
import socket
from urllib.parse import urlparse


class TargetNotAllowed(ValueError):
    """Raised when a scan target resolves to a non-public address."""


def _allow_private_targets() -> bool:
    """Escape hatch for local development / scanning your own LAN.

    Set ALLOW_PRIVATE_TARGETS=true in the backend environment to permit
    private/loopback targets (e.g. testing against a local app).
    """
    return os.getenv("ALLOW_PRIVATE_TARGETS", "false").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


def _is_public_ip(ip: str) -> bool:
    """True only for globally-routable, public IP addresses."""
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return not (
        addr.is_private
        or addr.is_loopback
        or addr.is_link_local  # blocks 169.254.169.254 cloud metadata
        or addr.is_multicast
        or addr.is_reserved
        or addr.is_unspecified
    )


def validate_target(raw_target: str) -> str:
    """Validate and normalize a scan target.

    - Requires an http/https URL with a hostname.
    - Resolves the hostname and rejects the target if ANY resolved
      address is non-public (defends against DNS-rebinding-style
      resolution to internal IPs).
    - Honors ALLOW_PRIVATE_TARGETS for local development.

    Returns the original target on success; raises TargetNotAllowed otherwise.
    """
    if not raw_target or not isinstance(raw_target, str):
        raise TargetNotAllowed("A target URL is required.")

    target = raw_target.strip()
    parsed = urlparse(target)

    if parsed.scheme not in ("http", "https"):
        raise TargetNotAllowed("Target must start with http:// or https://")

    host = parsed.hostname
    if not host:
        raise TargetNotAllowed("Target URL has no hostname.")

    if _allow_private_targets():
        return target

    # Resolve every address the host maps to; all must be public.
    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror as exc:
        raise TargetNotAllowed(f"Could not resolve host '{host}'.") from exc

    resolved_ips = {info[4][0] for info in infos}
    if not resolved_ips:
        raise TargetNotAllowed(f"Could not resolve host '{host}'.")

    for ip in resolved_ips:
        if not _is_public_ip(ip):
            raise TargetNotAllowed(
                f"Target '{host}' resolves to a non-public address ({ip}) "
                "and cannot be scanned. Set ALLOW_PRIVATE_TARGETS=true to "
                "allow internal targets in development."
            )

    return target
