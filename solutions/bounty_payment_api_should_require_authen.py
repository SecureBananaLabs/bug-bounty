import json
from datetime import datetime, timedelta
from typing import Dict, Any

import jwt
from fastapi import FastAPI, Depends, Header, HTTPException, status
from fastapi.requests import Request
from pydantic import BaseModel
import httpx
import asyncio

SECRET_KEY = "testsecret"
ALGORITHM = "HS256"

app = FastAPI()


class PaymentIntentCreate(BaseModel):
    amount: int
    currency: str = "usd"
    description: str | None = None


async def auth_middleware(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
        )
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
        )
    token = parts[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
        return {"user_id": user_id}
    except jwt.PyJWTError: