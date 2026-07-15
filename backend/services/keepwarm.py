# ===================================================
# CivicShield AI — Cold-start keep-warm
# Optional internal self-ping. When KEEP_WARM_URL is configured, an async task
# GETs {KEEP_WARM_URL}/health on an interval. This keeps the process (and the
# preloaded ML model) warm on hosts that idle-suspend after inactivity.
#
# NOTE: a self-ping only helps where the platform keeps serving as long as
# *some* traffic arrives. If your host hard-suspends the process, pair this with
# an EXTERNAL uptime pinger (UptimeRobot / cron-job.org) hitting /health.
# ===================================================
import asyncio
import logging

import requests

from config import settings

logger = logging.getLogger("civicshield.keepwarm")


async def keep_warm_loop() -> None:
    if not settings.keep_warm_url:
        return

    url = settings.keep_warm_url.rstrip("/") + "/health"
    interval = max(60, settings.keep_warm_interval_seconds)
    logger.info("Keep-warm enabled: pinging %s every %ss", url, interval)

    while True:
        await asyncio.sleep(interval)
        try:
            # Run the blocking request off the event loop.
            await asyncio.to_thread(requests.get, url, timeout=10)
            logger.debug("Keep-warm ping ok")
        except Exception as exc:  # noqa: BLE001 — a failed ping must never crash
            logger.warning("Keep-warm ping failed: %s", exc)
