from scrapers import BountyScraper
from analyzer import BountyAnalyzer
import json

def run_sniper():
    print("--- BOUNTY SNIPER BOT v1.0 ---")
    scraper = BountyScraper()
    analyzer = BountyAnalyzer()
    
    # In a real scenario, we would clone the target repo here
    # For the PR, we provide the core logic that the maintainer can integrate
    print("Scanning target codebase...")
    
    # Simulation of finding a bug to demonstrate the flow
    mock_content = ['api_key = "AIzaSyB1234567890abcdef"', 'query = f"SELECT * FROM users WHERE id={user_id}"']
    results = scraper.scan_for_bugs(mock_content)
    
    for res in results:
        analysis = analyzer.evaluate({"description": "Codebase Scan", "stack": ["Python"]})
        print(f"MATCH FOUND: {res['type']} | Priority: {analysis['priority']} | Autonomy: {analysis['autonomy_score']}%")

if __name__ == "__main__":
    run_sniper()
