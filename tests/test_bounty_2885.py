import requests

def test_pi_endpoint():
    url = "http://localhost:3000/api/pi"  # Update port if necessary
    test_cases = [
        (100, 102),  # 100 decimals + "3."
        (200, 202),
        (50, 52)
    ]
    
    for decimals, expected_length in test_cases:
        response = requests.get(url, params={"decimals": decimals})
        assert response.status_code == 200
        data = response.json()
        assert len(data["pi"]) == expected_length, f"Failed for {decimals} decimals"

if __name__ == "__main__":
    test_pi_endpoint()
    print("All tests passed!")
