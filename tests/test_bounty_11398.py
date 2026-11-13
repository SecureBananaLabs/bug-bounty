import requests
import os
import time

def test_bug_detection_workflow():
    # Trigger manual scan
    response = requests.post(
        "http://localhost:3000/api/bugs/detect",
        headers={"Authorization": f"Bearer {os.getenv('TEST_AUTH_TOKEN')}"}
    )
    assert response.status_code == 200, "Scan trigger failed"
    
    # Wait for async processing
    time.sleep(60)
    
    # Verify issue creation (mock verification)
    github_issues = requests.get(
        "https://api.github.com/repos/SecureBananaLabs/bug-bounty/issues",
        headers={"Authorization": f"Bearer {os.getenv('GITHUB_TOKEN')}"}
    ).json()
    
    assert any("Potential issue" in issue['title'] for issue in github_issues), \
           "No new issues created"
