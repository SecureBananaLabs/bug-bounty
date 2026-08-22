#!/usr/bin/env python3
"""Automated Auth Scanner for SecureBananaLabs/bug-bounty — bounty #11398"""
import os, re, sys

ROUTES_DIR = os.path.join(os.path.dirname(__file__), '..', 'apps', 'api', 'src', 'routes')

def scan():
    protected, unprotected = [], []
    for fname in sorted(os.listdir(ROUTES_DIR)):
        if not fname.endswith('.js'):
            continue
        path = os.path.join(ROUTES_DIR, fname)
        with open(path) as f:
            content = f.read()
        if 'authMiddleware' in content:
            protected.append(fname)
        else:
            eps = re.findall(r'\.(get|post|put|delete|patch)\s*\(\s*"([^"]+)"', content)
            unprotected.append({'file': fname, 'endpoints': [f'{m.upper()} {p}' for m,p in eps]})
    return protected, unprotected

if __name__ == '__main__':
    protected, unprotected = scan()
    print(f'PROTECTED ({len(protected)}):')
    for f in protected:
        print(f'  [OK] {f}')
    print(f'\nUNPROTECTED ({len(unprotected)}):')
    for u in unprotected:
        print(f'  [!!] {u["file"]}')
        for ep in u['endpoints']:
            print(f'       {ep}')
    print(f'\n{len(unprotected)} routes lack authMiddleware')
    sys.exit(1 if unprotected else 0)
