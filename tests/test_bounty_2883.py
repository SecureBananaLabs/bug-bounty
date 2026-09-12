import requests

def test_pi_endpoint():
    response = requests.get("http://localhost:3000/api/pi")
    data = response.json()
    
    assert response.status_code == 200
    assert "value" in data
    assert "note" in data
    assert data["value"] == 3.141592653589793
    assert "irrational" in data["note"].lower()
