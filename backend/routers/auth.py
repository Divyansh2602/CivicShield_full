# ===================================================
# CivicShield AI — Auth routes: register, login
# ===================================================
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from api.auth import create_access_token, hash_password, verify_password
from config import settings
from database.db import get_db
from database.models import User
from ratelimit import limiter
from schemas import AuthRequest, TokenResponse

router = APIRouter(tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.rate_limit_auth)
def register(request: Request, payload: AuthRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="User already exists"
        )

    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    return {"message": "User registered successfully"}


@router.post("/login", response_model=TokenResponse)
@limiter.limit(settings.rate_limit_auth)
def login(request: Request, payload: AuthRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    # Verify against the stored hash; verify_password is constant-ish and never
    # raises. Generic message avoids username enumeration.
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    token = create_access_token({"sub": user.username})
    return TokenResponse(access_token=token)
