import requests
import pytest

API_BASE = "http://localhost:3000"

# Test credentials (assumes test users exist in DB)
ADMIN_CREDS = {"username": "testadmin", "password": "secure123"}
USER_CREDS = {"username": "testuser", "password": "secure123"}

def get_token(creds):
    response = requests.post(f"{API_BASE}/api/auth/login", json=creds)
    return response.json().get("token") if response.ok else None

@pytest.mark.parametrize("scenario", [
    ("regular_user_self_assign", USER_CREDS, "testuser", 403),
    ("admin_assign_other", ADMIN_CREDS, "testuser", 200),
    ("admin_self_assign", ADMIN_CREDS, "testadmin", 403)
])
def test_role_assignment(scenario):
    _, creds, target_user, expected_status = scenario
    token = get_token(creds)
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    response = requests.patch(
        f"{API_BASE}/api/admin/users/{target_user}/role",
        json={"role": "admin"},
        headers=headers
    )
    
    assert response.status_code == expected_status, f"Failed: {scenario[0]}"

if __name__ == "__main__":
    pytest.main()
