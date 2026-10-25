"""
Patch for SecureBananaLabs/bug-bounty: registerUser access token can reference a different user id

This patch ensures that the user_id referenced in the access token matches the user being registered.
It prevents privilege escalation by verifying the token's user_id matches the registration payload.

Assumptions:
- There is a function `decode_access_token(token: str) -> dict` that decodes and validates the access token,
  returning a dictionary with at least a 'user_id' field.
- The registerUser function receives the access token and the registration payload (which may contain user_id).
- The user_id in the registration payload must match the user_id in the access token.

No external dependencies are used.
"""

from typing import Dict, Any, Optional

# Mock function for decoding access tokens (replace with actual implementation)
def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates the access token.

    Args:
        token (str): The access token.

    Returns:
        dict: Decoded token payload with at least 'user_id' key.

    Raises:
        ValueError: If the token is invalid.
    """
    # In production, replace this with secure JWT or token decoding logic.
    # Example payload: {"user_id": "abc123"}
    # For demonstration, assume token is "user:<user_id>"
    if not token.startswith("user:"):
        raise ValueError("Invalid token format")
    user_id = token.split(":", 1)[1]
    return {"user_id": user_id}


def registerUser(
    access_token: str,
    registration_payload: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Registers a new user, ensuring the access token's user_id matches the registration payload.

    Args:
        access_token (str): The access token of the user.
        registration_payload (dict): The registration data, must include 'user_id'.

    Returns:
        dict: Registration result.

    Raises:
        ValueError: If user_id mismatch or missing fields.
    """
    # Decode and validate the access token
    try:
        token_payload = decode_access_token(access_token)
    except Exception as e:
        raise ValueError(f"Invalid access token: {e}")

    token_user_id: Optional[str] = token_payload.get("user_id")
    payload_user_id: Optional[str] = registration_payload.get("user_id")

    if not token_user_id or not payload_user_id:
        raise ValueError("Missing user_id in token or registration payload.")

    if token_user_id != payload_user_id:
        raise ValueError("Access token user_id does not match registration payload user_id.")

    # Proceed with registration (replace with actual registration logic)
    # For demonstration, return a success message.
    return {
        "status": "success",
        "user_id": payload_user_id,
        "message": "User registered successfully."
    }


# --- TESTS ---

def test_registerUser_success():
    access_token = "user:abc123"
    registration_payload = {"user_id": "abc123", "email": "user@example.com"}
    result = registerUser(access_token, registration_payload)
    assert result["status"] == "success"
    assert result["user_id"] == "abc123"

def test_registerUser_userid_mismatch():
    access_token = "user:abc123"
    registration_payload = {"user_id": "xyz789", "email": "user@example.com"}
    try:
        registerUser(access_token, registration_payload)
    except ValueError as e:
        assert "does not match" in str(e)
    else:
        assert False, "Expected ValueError for user_id mismatch"

def test_registerUser_missing_userid():
    access_token = "user:abc123"
    registration_payload = {"email": "user@example.com"}
    try:
        registerUser(access_token, registration_payload)
    except ValueError as e:
        assert "Missing user_id" in str(e)
    else:
        assert False, "Expected ValueError for missing user_id"

def test_registerUser_invalid_token():
    access_token = "invalidtoken"
    registration_payload = {"user_id": "abc123", "email": "user@example.com"}
    try:
        registerUser(access_token, registration_payload)
    except ValueError as e:
        assert "Invalid token format" in str(e)
    else:
        assert False, "Expected ValueError for invalid token"

if __name__ == "__main__":
    test_registerUser_success()
    test_registerUser_userid_mismatch()
    test_registerUser_missing_userid()
    test_registerUser_invalid_token()
    print("All tests passed.")