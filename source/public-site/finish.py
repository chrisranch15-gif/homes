"""Post-build: WebP images, pre-rendered HTML, JSON-LD, minified JS, async fonts, crawl files."""
import asyncio, os, re, subprocess, glob
from PIL import Image
from playwright.async_api import async_playwright
ROOT = '/home/claude/public-site/sites'; TERSER = '/home/claude/public-site/fontpkg/node_modules/.bin/terser'
SITES = {'homes': ('https://homes.ranchpnw.com', [('19917.html', '/19917', '19917', 'story')]),
         'gotehaleh': ('https://gotehaleh.com', [('index.html', '/', 'tehaleh', 'tehaleh')]),
         'live': ('https://live.ranchpnw.com', [('bonney-lake.html', '/bonney-lake', 'bonney-lake', 'bonney-lake')])}
PORTS = {'homes': 8771, 'gotehaleh': 8772, 'live': 8773}

# 1. WebP at two widths
for site in SITES:
    for f in glob.glob(f'{ROOT}/{site}/photos/*.jpg'):
        b = f[:-4]
        if os.path.exists(b + '.webp') and os.path.getmtime(b + '.webp') > os.path.getmtime(f): continue
        im = Image.open(f).convert('RGB')
        big = im.copy(); big.thumbnail((1600, 1600)); big.save(b + '.webp', 'WEBP', quality=78, method=6)
        sm = im.copy(); sm.thumbnail((800, 800)); sm.save(b + '-800.webp', 'WEBP', quality=74, method=6)

# 2. minify inline scripts, load fonts without blocking the first paint
def minify(js):
    r = subprocess.run([TERSER, '--compress', '--mangle'], input=js.encode(), capture_output=True)
    return r.stdout.decode() if r.returncode == 0 and r.stdout else js
for site, (origin, pages) in SITES.items():
    for fn, path, page, route in pages:
        p = f'{ROOT}/{site}/{fn}'; s = open(p).read()
        s = re.sub(r'<script>\n(.*?)\n</script>', lambda m: '<script>' + (minify(m.group(1)) if len(m.group(1)) > 2000 else m.group(1)) + '</script>', s, flags=re.S)
        s = s.replace('<link href="https://fonts.googleapis.com/css2', '<link rel="preload" as="style" onload="this.onload=null;this.rel=\'stylesheet\'" href="https://fonts.googleapis.com/css2', 1)
        open(p, 'w').write(s)

# 3. pre-render in a headless browser (form endpoint blocked, so nothing is sent), inject HTML + JSON-LD
async def prerender():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for site, (origin, pages) in SITES.items():
            for fn, path, page, route in pages:
                pg = await b.new_page(viewport={'width': 1280, 'height': 900})
                await pg.route('https://script.google.com/**', lambda r: r.abort())
                await pg.goto(f'http://localhost:{PORTS[site]}/{fn}#{route}'); await pg.wait_for_timeout(1500)
                main = await pg.evaluate("document.getElementById('app').innerHTML")
                ld = await pg.evaluate(f"JSON.stringify(window.__jsonLd('{page}'))")
                await pg.close()
                p = f'{ROOT}/{site}/{fn}'; s = open(p).read()
                main = re.sub(r'<button class="navbtn"[^>]*>.*?</button>', '', main)
                s = re.sub(r'<main id="app" aria-live="polite">.*?</main>', lambda m: '<main id="app" aria-live="polite">' + main + '</main>', s, count=1, flags=re.S)
                s = re.sub(r'<script type="application/ld\+json">.*?</script>', '', s, flags=re.S)
                s = s.replace('</head>', '<script type="application/ld+json">' + ld.replace('</', '<\\/') + '</script></head>', 1)
                hero = re.search(r'<div class="photo"><img[^>]*?src="([^"]+)"', main)
                if hero and 'rel="preload" as="image"' not in s:
                    s = s.replace('<link rel="preconnect"', f'<link rel="preload" as="image" href="{hero.group(1)}" fetchpriority="high"><link rel="preconnect"', 1)
                open(p, 'w').write(s)
        await b.close()
import socket, time
procs = []
for site, port in PORTS.items():
    with socket.socket() as so:
        if so.connect_ex(('127.0.0.1', port)) != 0:
            procs.append(subprocess.Popen(['python3', '-m', 'http.server', str(port)], cwd=f'{ROOT}/{site}', stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL))
time.sleep(1)
try: asyncio.run(prerender())
finally:
    for pr in procs: pr.terminate()

# 4. crawl files
BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Googlebot', 'Bingbot', 'Applebot', 'Applebot-Extended', 'facebookexternalhit', 'meta-externalagent', 'Twitterbot', 'LinkedInBot', 'DuckDuckBot', 'CCBot']
LLMS = {
 'homes': """# 19917 145th St E, Bonney Lake, WA 98391 — The Ranch Real Estate Group

> A five-bedroom, 2.75-bath home in Tehaleh (Bonney Lake, Washington), listed November 19, 2026 at $775,000 by Chris Ranch of The Ranch Real Estate Group, Keller Williams Puget Sound.

- [Property page](https://homes.ranchpnw.com/19917): photos, verified features, FAQ and private-tour requests
- [Life in Tehaleh](https://gotehaleh.com/): the neighborhood guide — trails, parks, schools, The Retreat, nearby

## Verified facts
- Five bedrooms (the main-floor fifth is an office with no closet), 2.75 baths
- Mount Rainier views from the primary suite and two more bedrooms
- New 24×22 covered deck with composite decking and a plumbed fire pit; backs to recorded open-space greenbelt
- Central air conditioning, Cat-6 wiring, EV charger; extra-long garage
- Sumner-Bonney Lake School District
- Interior square footage is not published until confirmed against the county or builder record
""",
 'gotehaleh': """# Life in Tehaleh — a guide from The Ranch Real Estate Group

> Tehaleh (pronounced TAY-ha-lay) is a master-planned community of about 4,700 acres immediately south of Bonney Lake, Washington (ZIP 98391), owned by Brookfield Properties, with 40+ miles of connected trails, 18 parks, Post & Pour, and The Retreat clubhouse planned for 2027. Written by Chris Ranch, a former Tehaleh resident and listing agent.

- [The guide](https://gotehaleh.com/): every chapter, the at-a-glance facts and a sourced FAQ
- [Home for sale in Tehaleh: 19917 145th St E](https://homes.ranchpnw.com/19917)

## Key facts (sourced on the page)
- About 4,700 acres; more than 1,800 acres planned as parks, trails and open space; up to 9,700 homes planned
- 40+ miles of trails that connect into one network; 18 parks; Trek Bike Park with 17 trails; Hounds Hollow off-leash dog park
- The Retreat at Glacier Pointe: resident clubhouse planned for 2027 — clubhouse, 5,773 sq ft fitness center, two pickleball courts, café, lawn with Mount Rainier views
- Schools: split between the Sumner-Bonney Lake and Orting school districts
- About 21 miles to Tacoma, 43 to Seattle, 35 to Sea-Tac; Bonney Lake Costco about 12 minutes away
""",
 'live': """# Life in the Puget Sound — town guides from The Ranch Real Estate Group

> First-hand guides to Puget Sound towns, written by local agents of The Ranch Real Estate Group (Keller Williams Puget Sound), with every fact sourced on the page and every personal pick signed.

- [Life in Bonney Lake, WA](https://live.ranchpnw.com/bonney-lake): a day in the life, Chris Ranch's picks, Allan Yorke Park and Lake Tapps boat-launch rules, commute, errands, who it isn't for, FAQ
- [Life in Tehaleh](https://gotehaleh.com/): the neighborhood guide for Tehaleh, at Bonney Lake's south end
- [Homes for sale](https://homes.ranchpnw.com/)

## Bonney Lake key facts (sourced on the page)
- Pierce County, Washington, along SR-410; population 22,487 at the 2020 census; incorporated 1949
- Allan Yorke Park: 45 acres on the south end of Lake Tapps; boat launch open to Bonney Lake residents only for 2026 ($43.80/yr trailer parking pass)
- North Lake Tapps Park (Pierce County) has a public boat ramp, typically closed November-March
- Costco Bonney Lake: 9801 204th Ave E
"""}
for site, (origin, pages) in SITES.items():
    d = f'{ROOT}/{site}'
    open(f'{d}/robots.txt', 'w').write(''.join(f'User-agent: {b}\nAllow: /\n\n' for b in BOTS) + 'User-agent: *\nAllow: /\n\nSitemap: ' + origin + '/sitemap.xml\n')
    extra = f'<url><loc>{origin}/</loc><lastmod>2026-11-20</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>' if site in ('homes', 'live') else ''
    urls = extra + ''.join(f'<url><loc>{origin}{path}</loc><lastmod>2026-11-19</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>' for fn, path, page, route in pages)
    open(f'{d}/sitemap.xml', 'w').write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n')
    open(f'{d}/llms.txt', 'w').write(LLMS[site])
print('done')
