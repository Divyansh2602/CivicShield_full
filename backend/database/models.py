from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String, Text

from .db import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    target_url = Column(String, nullable=False)
    status = Column(String, default="queued", nullable=False, index=True)
    # Populated only when a scan fails, so status endpoints can surface a reason.
    error = Column(Text, nullable=True)
    # JSON-encoded attack-surface map, persisted so it survives restarts and is
    # available to the surface / api-security views without re-scanning.
    surface_map = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)


class Vulnerability(Base):
    __tablename__ = "vulnerabilities"

    id = Column(Integer, primary_key=True)
    scan_id = Column(Integer, index=True)
    risk = Column(String)
    vuln_type = Column(String)
    url = Column(String)
    param = Column(String)
    payload = Column(Text)
    evidence = Column(Text)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow)
