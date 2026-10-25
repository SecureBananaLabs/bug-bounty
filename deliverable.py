"""
SecureBananaLabs/bug-bounty
Patch for: Freelancer profile route should resolve mock profiles by username
Source: https://github.com/SecureBananaLabs/bug-bounty/issues/2849

This patch updates the freelancer profile route to resolve mock profiles by username.
Assumptions:
- There is a Flask-like web framework in use.
- There is a 'get_freelancer_profile_by_username' function for real profiles.
- There is a 'get_mock_profile_by_username' function for mock profiles.
- The route is '/freelancer/<username>'.
- The response is JSON serializable.

This code is pure Python and contains no external dependencies.
"""

from typing import Optional, Dict, Any

# Mock database for demonstration purposes
REAL_PROFILES = {
    "alice": {"username": "alice", "name": "Alice Smith", "type": "real"},
    "bob": {"username": "bob", "name": "Bob Jones", "type": "real"},
}

MOCK_PROFILES = {
    "mock_jane": {"username": "mock_jane", "name": "Jane Doe", "type": "mock"},
    "mock_john": {"username": "mock_john", "name": "John Roe", "type": "mock"},
}


def get_freelancer_profile_by_username(username: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve a real freelancer profile by username.
    """
    return REAL_PROFILES.get(username)


def get_mock_profile_by_username(username: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve a mock freelancer profile by username.
    """
    return MOCK_PROFILES.get(username)


def resolve_freelancer_profile(username: str) -> Optional[Dict[str, Any]]:
    """
    Resolve a freelancer profile by username, checking real profiles first,
    then mock profiles if not found.
    """
    profile = get_freelancer_profile_by_username(username)
    if profile is not None:
        return profile
    return get_mock_profile_by_username(username)


# Simulated route handler (e.g., Flask view function)
def freelancer_profile_route(username: str) -> Dict[str, Any]:
    """
    Route handler for /freelancer/<username>.
    Returns the freelancer profile as a JSON-serializable dict,
    or a 404 error dict if not found.
    """
    profile = resolve_freelancer_profile(username)
    if profile is not None:
        return {"status": "success", "profile": profile}
    return {"status": "error", "message": "Profile not found", "code": 404}


# ------------------ TESTS ------------------

def test_freelancer_profile_route() -> None:
    """
    Test cases for freelancer_profile_route.
    """
    # Test real profile
    result1 = freelancer_profile_route("alice")
    assert result1["status"] == "success"
    assert result1["profile"]["username"] == "alice"
    assert result1["profile"]["type"] == "real"

    # Test mock profile
    result2 = freelancer_profile_route("mock_jane")
    assert result2["status"] == "success"
    assert result2["profile"]["username"] == "mock_jane"
    assert result2["profile"]["type"] == "mock"

    # Test not found
    result3 = freelancer_profile_route("unknown_user")
    assert result3["status"] == "error"
    assert result3["code"] == 404

    print("All tests passed.")


if __name__ == "__main__":
    test_freelancer_profile_route()