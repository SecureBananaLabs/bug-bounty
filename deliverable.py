"""
Patch for SecureBananaLabs/bug-bounty: Secure the auth refresh endpoint to verify the requester before issuing new tokens.

This implementation assumes a typical JWT-based authentication system with refresh tokens.
The refresh endpoint now verifies:
  - The refresh token is present and valid.
  - The refresh token is associated with a valid user.
  - The refresh token is not expired or revoked.
  - The requester matches the user associated with the refresh token (e.g., via user_id in token claims).

This code is pure Python, modular, and does not use any external dependencies.
"""

import base64
import hmac
import hashlib
import json
import time
from typing import Optional, Dict, Any

# --- Configuration (Replace with your secure values in production) ---
SECRET_KEY = "supersecretkey"
REFRESH_TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * 7  # 7 days
ACCESS_TOKEN_EXPIRY_SECONDS = 60 * 15  # 15 minutes

# --- In-memory storage for demonstration (replace with DB in production) ---
USERS_DB = {
    "user123": {
        "id": "user123",
        "username": "alice",
        "refresh_tokens": set(),  # Set of valid refresh tokens
    }
}


# --- Utility functions for JWT-like tokens (HS256) ---

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('ascii')


def _base64url_decode(data: str) -> bytes:
    padding = '=' * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def _sign(data: bytes, key: str) -> str:
    return _base64url_encode(hmac.new(key.encode(), data, hashlib.sha256).digest())


def encode_jwt(payload: Dict[str, Any], key: str, alg: str = "HS256") -> str:
    header = {"typ": "JWT", "alg": alg}
    header_b64 = _base64url_encode(json.dumps(header, separators=(',', ':')).encode())
    payload_b64 = _base64url_encode(json.dumps(payload, separators=(',', ':')).encode())
    signing_input = f"{header_b64}.{payload_b64}".encode()
    signature = _sign(signing_input, key)
    return f"{header_b64}.{payload_b64}.{signature}"


def decode_jwt(token: str, key: str) -> Optional[Dict[str, Any]]:
    try:
        header_b64, payload_b64, signature = token.split('.')
        signing_input = f"{header_b64}.{payload_b64}".encode()
        expected_sig = _sign(signing_input, key)
        if not hmac.compare_digest(signature, expected_sig):
            return None
        payload = json.loads(_base64url_decode(payload_b64))
        return payload
    except Exception:
        return None


# --- Token Generation and Verification ---

def generate_refresh_token(user_id: str) -> str:
    now = int(time.time())
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + REFRESH_TOKEN_EXPIRY_SECONDS,
        "type": "refresh"
    }
    token = encode_jwt(payload, SECRET_KEY)
    # Store the token for the user (for revocation check)
    USERS_DB[user_id]["refresh_tokens"].add(token)
    return token


def generate_access_token(user_id: str) -> str:
    now = int(time.time())
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + ACCESS_TOKEN_EXPIRY_SECONDS,
        "type": "access"
    }
    return encode_jwt(payload, SECRET_KEY)


def is_refresh_token_valid(token: str, user_id: str) -> bool:
    payload = decode_jwt(token, SECRET_KEY)
    if not payload:
        return False
    if payload.get("type") != "refresh":
        return False
    if payload.get("sub") != user_id:
        return False
    if int(time.time()) > payload.get("exp", 0):
        return False
    # Check if token is in user's valid refresh tokens (not revoked)
    return token in USERS_DB.get(user_id, {}).get("refresh_tokens", set())


# --- Secure Refresh Endpoint Implementation ---

def refresh_token_endpoint(request: Dict[str, Any]) -> Dict[str, Any]:
    """
    Secure refresh endpoint.
    Expects:
        request = {
            "refresh_token": "<refresh_token>",
            "user_id": "<user_id>",  # The requester must provide their user_id
        }
    Returns:
        {
            "access_token": "<new_access_token>",
            "refresh_token": "<new_refresh_token>",
        }
        or error response
    """
    refresh_token = request.get("refresh_token")
    user_id = request.get("user_id")

    if not refresh_token or not user_id:
        return {"error": "Missing refresh_token or user_id"}, 400

    # Step 1: Verify the refresh token is valid and belongs to the user
    if not is_refresh_token_valid(refresh_token, user_id):
        return {"error": "Invalid or expired refresh token"}, 401

    # Step 2: Issue new tokens
    new_access_token = generate_access_token(user_id)
    new_refresh_token = generate_refresh_token(user_id)

    # Step 3: Revoke the old refresh token (optional, for single-use tokens)
    USERS_DB[user_id]["refresh_tokens"].discard(refresh_token)

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token
    }, 200


# --- Tests ---

def _test_refresh_flow():
    # Simulate user login and refresh flow
    user_id = "user123"
    print("Generating initial tokens...")
    refresh_token = generate_refresh_token(user_id)
    access_token = generate_access_token(user_id)

    # Valid refresh
    print("Testing valid refresh...")
    req = {"refresh_token": refresh_token, "user_id": user_id}
    resp, status = refresh_token_endpoint(req)
    assert status == 200, f"Expected 200, got {status}"
    assert "access_token" in resp and "refresh_token" in resp

    # Old refresh token should be revoked
    print("Testing revoked refresh token...")
    resp2, status2 = refresh_token_endpoint({"refresh_token": refresh_token, "user_id": user_id})
    assert status2 == 401, f"Expected 401, got {status2}"

    # Invalid user_id
    print("Testing mismatched user_id...")
    new_refresh_token = resp["refresh_token"]
    resp3, status3 = refresh_token_endpoint({"refresh_token": new_refresh_token, "user_id": "wronguser"})
    assert status3 == 401, f"Expected 401, got {status3}"

    # Tampered token
    print("Testing tampered token...")
    tampered_token = new_refresh_token[:-1] + ('A' if new_refresh_token[-1] != 'A' else 'B')
    resp4, status4 = refresh_token_endpoint({"refresh_token": tampered_token, "user_id": user_id})
    assert status4 == 401, f"Expected 401, got {status4}"

    print("All tests passed.")


if __name__ == "__main__":
    _test_refresh_flow()