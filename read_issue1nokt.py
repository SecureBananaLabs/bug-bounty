import requests
HEADERS = {'Accept': 'application/vnd.github.v3+json'}
r = requests.get('https://api.github.com/repos/noktadev/sst-eks-surrealdb/issues/1', headers=HEADERS, timeout=10)
if r.status_code == 200:
    item = r.json()
    print("BODY:")
    print(item.get('body', '')[:3000])
    cr = requests.get(item.get('comments_url', ''), headers=HEADERS, timeout=10)
    if cr.status_code == 200:
        print("\n=== COMMENTS ===")
        for c in cr.json()[:5]:
            print(f"\n--- {c.get('user', {}).get('login', '?')} ---")
            print(c.get('body', '')[:400])
