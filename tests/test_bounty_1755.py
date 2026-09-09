import requests
import pytest

API_URL = "http://localhost:3000/api/auth/register"

def test_reject_admin_role():
    payload = {
        "email": "admin@test.com",
        "password": "secure123",
        "role": "admin"
    }
    response = requests.post(API_URL, json=payload)
    assert response.status_code == 400, "Admin role should be rejected"

@pytest.mark.parametrize("role", [None, "client", "freelancer"])
def test_valid_roles(role):
    payload = {
        "email": f"valid_{role or 'default'}@test.com",
        "password": "secure123"
    }
    if role:
        payload["role"] = role
    
    response = requests.post(API_URL, json=payload)
    assert response.status_code == 201, f"Role {role} should be accepted"
    if not role:
        assert response.json()["role"] == "client", "Default role must be client"

def test_invalid_role():
    payload = {
        "email": "invalid@test.com",
        "password": "secure123",
        "role": "user"
    }
    response = requests.post(API_URL, json=payload)
    assert response.status_code == 400, "Invalid roles should be rejected"
