from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from .db import Base


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    target_url = Column(String, nullable=False)
    status = Column(String, default="queued")
    created_at = Column(DateTime, default=datetime.utcnow)


class Vulnerability(Base):
    __tablename__ = "vulnerabilities"

    id = Column(Integer, primary_key=True)
    scan_id = Column(Integer)
    risk = Column(String)
    vuln_type = Column(String)
    url = Column(String)
    param = Column(String)
    payload = Column(Text)
    evidence = Column(Text)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)