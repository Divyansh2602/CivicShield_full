# ===================================================
# CivicShield AI — Shared rate limiter
# One Limiter instance shared by all routers and registered on the app in
# main.py (app.state.limiter + exception handler).
# ===================================================
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
