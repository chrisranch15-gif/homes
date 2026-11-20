"""Nightly website check. Runs on GitHub Actions; posts results to the Ranch email engine,
which writes them to the Checks tab the Ranch hub reads. Edit checks.json to add pages."""
import json, os, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__))
API = 'https://script.google.com/macros/s/AKfycbz0ALnuwyuwKaRkr2sGS7N_TPJ3DIXYYRiLP7RiNlBvv5HfQMxfy82jS88ihRab7Duu/exec'
rows = []
for c in json.load(open(os.path.join(HERE, 'checks.json'))):
    try:
        req = urllib.request.Request(c['url'], headers={'User-Agent': 'RanchSiteCheck/1.0'})
        with urllib.request.urlopen(req, timeout=30) as r:
            body, ctype, code = r.read(), r.headers.get('Content-Type', ''), r.status
        problems = []
        if code != 200: problems.append(f'HTTP {code}')
        if c.get('type') and not ctype.startswith(c['type']): problems.append(f'Expected {c["type"]}, got {ctype}')
        text = body.decode('utf-8', 'ignore') if not c.get('type') else ''
        for e in c.get('expect', []):
            if e.lower() not in text.lower(): problems.append(f'Missing "{e}"')
        rows.append([c['site'], c['url'], 'OK' if not problems else 'Problem', 'Loads, content as expected' if not problems else '; '.join(problems)])
    except Exception as e:
        rows.append([c['site'], c['url'], 'Problem', f'Did not load: {e}'[:190]])
print(json.dumps(rows, indent=1))
req = urllib.request.Request(API, data=json.dumps({'type': 'check', 'rows': rows}).encode(), headers={'Content-Type': 'text/plain;charset=utf-8'})
print(urllib.request.urlopen(req, timeout=60).read().decode()[:200])
