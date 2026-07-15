# ===================================================
# CivicShield AI — SSRF protection
# The scanner fetches attacker-supplied URLs. Without this guard a caller could
# point it at cloud metadata endpoints (169.254.169.254), localhost admin
# panels, or internal RFC-1918 hosts. We resolve the target and reject any that
# land on non-public address space (unless explicitly allowed in dev).
# ===================================================
import ipaddress
import socket
from urllib.parse import urlparse

from config import settings


class TargetNotAllowed(ValueError):
    """Raised when a target is malformed or resolves to a disallowed address."""


def _is_public_ip(ip: str) -> bool:
    addr = ipaddress.ip_address(ip)
    return not (
        addr.is_private
        or addr.is_loopback
        or addr.is_link_local
        or addr.is_multicast
        or addr.is_reserved
        or addr.is_unspecified
    )


def validate_target(raw_target: str) -> str:
    """Validate and normalize a scan target URL.

    Returns the normalized URL (scheme guaranteed http/https) or raises
    TargetNotAllowed. Honors settings.allow_private_targets for local dev.
    """
    if not raw_target or len(raw_target) > settings.max_target_length:
        raise TargetNotAllowed("Target is empty or too long")

    target = raw_target.strip()
    if not target.startswith(("http://", "https://")):
        target = f"https://{target}"

    parsed = urlparse(target)
    if parsed.scheme not in ("http", "https"):
        raise TargetNotAllowed("Only http and https targets are allowed")

    host = parsed.hostname
    if not host:
        raise TargetNotAllowed("Target has no host")

    if settings.allow_private_targets:
        return target

    # Resolve every address the host maps to; reject if ANY is non-public
    # (defends against DNS records that include an internal A record).
    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror:
        raise TargetNotAllowed("Target host could not be resolved")

    resolved = {info[4][0] for info in infos}
    if not resolved:
        raise TargetNotAllowed("Target host could not be resolved")

    for ip in resolved:
        if not _is_public_ip(ip):
            raise TargetNotAllowed(
                "Target resolves to a private or reserved address and cannot be scanned"
            )

    return target
