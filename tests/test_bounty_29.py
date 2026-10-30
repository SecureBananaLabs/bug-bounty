import pytest
from fastapi.testclient import TestClient
from apps.api.src.app import createApp
from apps.api.src.utils.auth import createToken

app = createApp()
client = TestClient(app)

# Mock admin token
admin_token = createToken({ id: 'admin1', role: 'ADMIN' })
user_token = createToken({ id: 'user1', role: 'USER' })

def test_admin_guard():
    # Non-admin access
    response = client.get("/api/admin/users", headers={"Authorization": f"Bearer {user_token}"})
    assert response.status_code == 403
    
    # Admin access
    response = client.get("/api/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200

def test_user_suspension():
    response = client.put(
        "/api/admin/users/user1/suspend",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    # Verify DB update in separate test

def test_job_moderation():
    response = client.get(
        "/api/admin/jobs/flagged",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)
