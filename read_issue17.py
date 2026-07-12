import requests

HEADERS = {'Accept': 'application/vnd.github.v3+json'}

r = requests.get('https://api.github.com/repos/xevrion-v2/agent-playground/issues/17', headers=HEADERS, timeout=10)
if r.status_code == 200:
    item = r.json()
    print("TITLE:", item.get('title'))
    print("\nBODY:")
    print(item.get('body', '')[:3000])
    print("\nLABELS:", [l['name'] for l in item.get('labels', [])])
    
    cr = requests.get(item.get('comments_url', ''), headers=HEADERS, timeout=10)
    if cr.status_code == 200:
        print("\n=== COMMENTS (first 5) ===")
        for c in cr.json()[:5]:
            print(f"\n--- {c.get('user', {}).get('login', '?')} ---")
            print(c.get('body', '')[:500])
