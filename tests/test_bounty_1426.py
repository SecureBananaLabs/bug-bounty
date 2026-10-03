import requests

def test_prevent_admin_self_assignment(api_url, admin_auth_header, user_auth_header, user_id, admin_id):
    # Regular user cannot access admin route
    response = requests.patch(
        f"{api_url}/api/admin/users/{user_id}/role",
        headers=user_auth_header,
        json={"role": "ADMIN"}
    )
    assert response.status_code == 403

    # Admin can assign another user as admin
    response = requests.patch(
        f"{api_url}/api/admin/users/{user_id}/role",
        headers=admin_auth_header,
        json={"role": "ADMIN"}
    )
    assert response.status_code == 200
    assert response.json()["role"] == "ADMIN"

    # Admin cannot self-assign admin role
    response = requests.patch(
        f"{api_url}/api/admin/users/{admin_id}/role",
        headers=admin_auth_header,
        json={"role": "ADMIN"}
    )
    assert response.status_code == 403
