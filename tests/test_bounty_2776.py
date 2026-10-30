import requests

def test_unauthenticated_review_creation():
    # Test unauthenticated POST request
    response = requests.post("http://localhost:3000/api/reviews", json={
        "review": "This is a test review"
    })
    
    # Verify authentication is required (expect 401/403)
    assert response.status_code in [401, 403], \
        f"Expected 401/403, got {response.status_code}"
