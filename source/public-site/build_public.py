"""Builds the two public sites (GitHub Pages) from the same source as the Concierge.
   homes/     → homes.ranchpnw.com   (listing pages: /19917)
   gotehaleh/ → gotehaleh.com        (the Tehaleh guide at the root)"""
import sys, os, shutil, json
APP = '/home/claude/app'; ROOT = '/home/claude/public-site/sites'
API = sys.argv[1] if len(sys.argv) > 1 else 'https://script.google.com/macros/s/AKfycbz0ALnuwyuwKaRkr2sGS7N_TPJ3DIXYYRiLP7RiNlBvv5HfQMxfy82jS88ihRab7Duu/exec'
HOMES, GUIDE = 'https://homes.ranchpnw.com', 'https://gotehaleh.com'
css = open(f'{APP}/src/styles.css').read()
app = open(f'{APP}/src/app.js').read().replace('/* ---------- start ---------- */', open(f'{APP}/src/extras.js').read() + '\n/* ---------- start ---------- */')
libs = [open(f'{APP}/vendor/node_modules/qrcode-generator/qrcode.js').read(), open(f'{APP}/src/engine.js').read()]
PAGES = [
  dict(site='homes', file='19917.html', page='19917', url=f'{HOMES}/19917', title='19917 145th St E, Bonney Lake, WA 98391 · 5-Bed Tehaleh Home for Sale',
       desc='Listed at $775,000: 5 bedrooms, 2.75 baths, over $100K in upgrades, Mount Rainier views, central AC and a new covered deck backing to the greenbelt in Tehaleh, Bonney Lake. Presented by The Ranch Real Estate Group.',
       image='photos/og-19917.jpg', alt='19917 145th St E in Tehaleh, presented by The Ranch Real Estate Group', origin=HOMES),
  dict(site='gotehaleh', file='index.html', page='tehaleh', url=f'{GUIDE}/', title='Living in Tehaleh, Bonney Lake WA: Trails, Parks, Schools & The Retreat (2026 Guide)',
       desc='What it’s really like to live in Tehaleh, the 4,700-acre community south of Bonney Lake: 40+ miles of connected trails, 18 parks, Post & Pour, The Retreat clubhouse (2027), schools, Costco and Lake Tapps — from a local agent who lived there.',
       image='photos/og-tehaleh.jpg', alt='Life in Tehaleh: a Tehaleh boulevard leading to Mount Rainier', origin=GUIDE),
]
for site, domain in [('homes', 'homes.ranchpnw.com'), ('gotehaleh', 'gotehaleh.com')]:
    out = f'{ROOT}/{site}'; os.makedirs(out, exist_ok=True)
    for d in ['photos', 'thumbs']: shutil.copytree(f'{APP}/{d}', f'{out}/{d}', dirs_exist_ok=True)
    open(f'{out}/CNAME', 'w').write(domain + '\n'); open(f'{out}/robots.txt', 'w').write('User-agent: *\nAllow: /\n'); open(f'{out}/.nojekyll', 'w').write('')
for m in PAGES:
    cfg = dict(api=API, page=m['page'], url=f'{HOMES}/19917', homeUrl=f'{HOMES}/19917', guideUrl=GUIDE, state='market_engagement', listedAt=1795132800000, openHouse=None)
    img = f"{m['origin']}/{m['image']}"
    head = f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{m['title']}</title>
<meta name="description" content="{m['desc']}">
<link rel="canonical" href="{m['url']}">
<meta property="og:type" content="website"><meta property="og:site_name" content="The Ranch Real Estate Group">
<meta property="og:title" content="{m['title']}"><meta property="og:description" content="{m['desc']}">
<meta property="og:url" content="{m['url']}"><meta property="og:image" content="{img}"><meta property="og:image:secure_url" content="{img}">
<meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="{m['alt']}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{m['title']}"><meta name="twitter:description" content="{m['desc']}"><meta name="twitter:image" content="{img}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%2316191B'/%3E%3Ctext x='32' y='44' font-family='Georgia' font-size='36' fill='%23D9C2A0' text-anchor='middle'%3ER%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>{css}</style></head>
<body><main id="app" aria-live="polite"></main>
<script>const PUBLIC_SITE = {json.dumps(cfg)};</script>
'''
    body = ''.join(f'<script>\n{j}\n</script>\n' for j in libs + [app.replace('__ARTIFACT_URL__', HOMES + '/19917')])
    open(f"{ROOT}/{m['site']}/{m['file']}", 'w').write(head + body + '</body></html>')
open(f'{ROOT}/homes/index.html', 'w').write(f'<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=/19917"><title>The Ranch Real Estate Group</title></head><body><a href="/19917">19917 145th St E</a></body></html>')
print('built', {s: sorted(x for x in os.listdir(f'{ROOT}/{s}') if '.' in x) for s in ['homes', 'gotehaleh']})

# seller portal (static, noindex) — reads live numbers from the email engine
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sites/homes/sellers.html'), 'w').write(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sellers.template.html')).read().replace('__API__', API))
