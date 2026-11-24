"""homes.ranchpnw.com/reviews: client reviews in our own design.
Data: source/content/reviews.json (quoted word for word from Google; first name + last initial).
Run: python3 source/public-site/build_reviews.py  -> reviews.html at the repo root."""
import json, html, os
E = html.escape
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
R = json.load(open(os.path.join(ROOT, 'source', 'content', 'reviews.json')))
META = {'rating': '5.0', 'count': 83, 'as_of': 'November 2026',
        'google': 'https://www.google.com/maps?cid=13168785543785810551'}
GROUPS = [('sell', 'Selling', 'Sold fast, and for the right price.'),
          ('buy', 'Buying', 'The right home, and someone in their corner.'),
          ('off', 'Off market', 'Found before anyone else knew.'),
          ('who', 'Who we are', 'What people say when they’ve known us for years.')]

def card(r, big=False):
    paras = ''.join(f'<p>{E(p.strip())}</p>' for p in r['text'].split('\n') if p.strip())
    body = f'<div class="full">{paras}</div>' if big else f'<details><summary>Read the whole review</summary><div class="full">{paras}</div></details>'
    return (f'<figure class="rv{" big" if big else ""}"><blockquote><p class="pull">“{E(r["pull"])}”</p>{body}</blockquote>'
            + (f'<p class="note"><span>Behind the scenes</span> {E(r["note"])}</p>' if r.get('note') else '') + f'<figcaption><span class="stars" aria-label="5 stars">★★★★★</span> {E(r["name"])} · {E(r["source"])} review</figcaption></figure>')

feat = R[0]
sections = ''
for key, title, line in GROUPS:
    items = [r for r in R[1:] if r['group'] == key]
    if not items: continue
    extra = '<p class="more"><a href="/unlisted">How Unlisted finds homes that aren’t on the market →</a></p>' if key == 'off' else ''
    sections += f'<section class="grp"><div class="gh"><p class="eyebrow">{E(title)}</p><h2>{E(line)}</h2></div><div class="cols{' one' if key == 'off' else ''}">{"".join(card(r, key == 'off') for r in items)}</div>{extra}</section>'

ld = {"@context": "https://schema.org", "@graph": [
  {"@type": "RealEstateAgent", "@id": "https://www.ranchpnw.com/#org", "name": "The Ranch Real Estate Group", "url": "https://www.ranchpnw.com",
   "sameAs": [META['google']], "telephone": "+1-253-335-5630", "parentOrganization": {"@type": "Organization", "name": "Keller Williams Realty Puget Sound"},
   "areaServed": ["Gig Harbor, WA", "Fox Island, WA", "Tacoma, WA", "Bonney Lake, WA", "Lake Tapps, WA", "Federal Way, WA"],
   "employee": {"@type": "Person", "@id": "https://www.ranchpnw.com/#chris", "name": "Chris Ranch", "telephone": "+1-253-335-5630"}},
  {"@type": "WebPage", "name": "Client reviews · The Ranch Real Estate Group", "url": "https://homes.ranchpnw.com/reviews", "about": {"@id": "https://www.ranchpnw.com/#org"}},
  {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "The Ranch Real Estate Group", "item": "https://www.ranchpnw.com"},
     {"@type": "ListItem", "position": 2, "name": "Reviews", "item": "https://homes.ranchpnw.com/reviews"}]}]}

page = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Client Reviews · Chris Ranch · The Ranch Real Estate Group</title>
<meta name="description" content="{META['count']} Google reviews, every one five stars. What buyers and sellers around Puget Sound say about Chris Ranch and The Ranch Real Estate Group, in their own words.">
<link rel="canonical" href="https://homes.ranchpnw.com/reviews">
<meta property="og:type" content="website"><meta property="og:site_name" content="The Ranch Real Estate Group">
<meta property="og:title" content="In our clients’ words · The Ranch Real Estate Group"><meta property="og:description" content="{META['rating']} stars across {META['count']} Google reviews.">
<meta property="og:url" content="https://homes.ranchpnw.com/reviews"><meta property="og:image" content="https://homes.ranchpnw.com/marketing/og-reviews.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500;600&display=swap">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
<style>
:root{{--night:#16191B;--ink:#1E2327;--paper:#F7F5F1;--stone:#ECE7DF;--sand:#E7D7BF;--brass:#8C6A43;--muted:#5F5950;--line:#DCD4C8;--serif:'Playfair Display',Georgia,serif}}
*{{box-sizing:border-box}}html,body{{margin:0;background:var(--paper);color:var(--ink);font:17px/1.65 Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}}
a{{color:var(--brass)}}.wrap{{max-width:1180px;margin:0 auto;padding:0 clamp(20px,4vw,48px)}}
.eyebrow{{margin:0;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:var(--brass);font-weight:500}}
h1,h2{{font-family:var(--serif);font-weight:400;letter-spacing:-.01em;text-wrap:balance}}
.hero{{position:relative;background:radial-gradient(120% 90% at 78% 8%,#2A3136 0%,#16191B 55%,#0F1113 100%);color:var(--paper);overflow:hidden}}
.hero .wrap{{padding-top:110px;padding-bottom:clamp(56px,8vw,96px)}}
.top{{position:absolute;left:0;right:0;top:0;display:flex;justify-content:space-between;align-items:center;padding:22px clamp(20px,4vw,48px);z-index:2}}
.top .mark{{font-family:var(--serif);font-size:18px;color:var(--paper);text-decoration:none}}.top a.cta{{color:var(--paper);text-decoration:none;font-size:14px;letter-spacing:.06em;border:1px solid rgba(247,245,241,.55);padding:10px 16px}}
.hero .eyebrow{{color:var(--sand)}}
.score{{display:flex;align-items:flex-end;gap:22px;margin-top:22px;flex-wrap:wrap}}
.score .n{{font-family:var(--serif);font-size:clamp(96px,14vw,176px);line-height:.85;color:var(--sand)}}
.score .s{{padding-bottom:10px}}.score .st{{color:var(--sand);font-size:22px;letter-spacing:4px}}.score p{{margin:6px 0 0;color:#CFC9C0;font-size:16px}}
.hero blockquote{{margin:clamp(40px,6vw,72px) 0 0;padding-top:28px;border-top:1px solid rgba(231,215,191,.3);max-width:900px}}
.hero blockquote p{{font-family:var(--serif);font-size:clamp(28px,3.6vw,46px);line-height:1.2;margin:0}}
.hero blockquote cite{{display:block;margin-top:16px;font-style:normal;font-size:14px;letter-spacing:.12em;text-transform:uppercase;color:#B9B3AA}}
main section.grp{{padding:clamp(64px,8vw,112px) 0 0}}
.gh h2{{font-size:clamp(32px,4.2vw,50px);line-height:1.08;margin:12px 0 0;max-width:18ch}}
.cols{{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;margin-top:36px;align-items:start}}
.rv{{margin:0;background:#fff;padding:28px 28px 22px;border-top:2px solid var(--brass)}}
.rv blockquote{{margin:0}}.rv .pull{{font-family:var(--serif);font-size:24px;line-height:1.3;margin:0 0 14px}}
.rv details summary{{cursor:pointer;color:var(--brass);font-size:14px;list-style:none}}.rv details summary::-webkit-details-marker{{display:none}}
.rv details[open] summary{{display:none}}.rv .full p{{margin:0 0 10px;color:#3B3A36;font-size:15.5px}}
.rv figcaption{{margin-top:14px;font-size:13px;color:var(--muted);letter-spacing:.02em}}.stars{{color:var(--brass);letter-spacing:2px}}
.rv .note{{margin:16px 0 0;padding:12px 14px;background:var(--stone);font-size:14px;color:#3B3A36}}.rv .note span{{display:block;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--brass);margin-bottom:2px}}.more{{margin:14px 0 0;font-size:16px}}.cols.one{{grid-template-columns:1fr;max-width:820px}}.rv.big .pull{{font-size:clamp(26px,3vw,34px)}}
.close{{margin-top:clamp(72px,9vw,120px);background:var(--night);color:var(--paper);padding:clamp(64px,8vw,104px) 0}}
.close h2{{font-size:clamp(34px,4.6vw,56px);line-height:1.08;margin:12px 0 0;max-width:16ch}}.close .eyebrow{{color:var(--sand)}}.close p{{color:#CFC9C0;max-width:600px}}
.btns{{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}}.btn{{display:inline-flex;align-items:center;min-height:50px;padding:0 24px;font:500 15px Inter,sans-serif;text-decoration:none;background:var(--paper);color:var(--ink)}}.btn.line{{background:transparent;color:var(--paper);box-shadow:inset 0 0 0 1px currentColor}}
.foot{{padding:40px 0 110px;font-size:13px;color:#5F5950}}.foot p{{margin:10px 0 0;max-width:820px}}
.mbar{{position:fixed;left:12px;right:12px;bottom:12px;z-index:5;display:none;gap:8px;padding:8px;background:var(--night)}}.mbar .btn{{min-height:46px;flex:1;justify-content:center}}
@media(max-width:760px){{.mbar{{display:flex}}.top a.cta{{display:none}}}}
</style></head><body>
<header class="hero"><div class="top"><a class="mark" href="https://www.ranchpnw.com">The Ranch Real Estate Group</a><a class="cta" href="#talk">Talk with Chris</a></div>
<div class="wrap"><p class="eyebrow">In our clients’ words</p><h1 style="font-size:clamp(40px,6vw,76px);line-height:1;margin:16px 0 0;max-width:14ch">Every review, five stars.</h1>
<div class="score"><span class="n">{META['rating']}</span><div class="s"><div class="st" aria-hidden="true">★★★★★</div><p>{META['count']} Google reviews · as of {META['as_of']}</p></div></div>
<blockquote><p>“{E(feat['pull'])}”</p><cite>{E(feat['name'])} · Google review</cite></blockquote></div></header>
<main><div class="wrap">{sections}
<p class="more" style="margin-top:40px">Reviews are quoted word for word from Google. <a href="{META['google']}" target="_blank" rel="noopener">Read all {META['count']} on Google →</a></p></div>
<section class="close" id="talk"><div class="wrap"><p class="eyebrow">Your turn</p><h2>Let’s talk about your next move.</h2>
<p>Buying, selling, or looking for something that isn’t on the market, call or text me directly.</p>
<div class="btns"><a class="btn" href="tel:+12533355630">Call (253) 335-5630</a><a class="btn line" href="sms:+12533355630">Text Chris</a><a class="btn line" href="/unlisted">Explore Unlisted</a><a class="btn line" href="/sell">Selling? Start here</a></div></div></section></main>
<footer class="foot"><div class="wrap"><p><strong>Keller Williams Realty Puget Sound</strong> · 33434 8th Ave S, Suite 103, Federal Way, WA 98003 · Each Office Is Independently Owned and Operated. Equal Housing Opportunity.</p>
<p>Chris Ranch, The Ranch Real Estate Group, is a licensed real estate broker with Keller Williams Realty Puget Sound. © 2026 The Ranch Real Estate Group.</p></div></footer>
<div class="mbar"><a class="btn" href="tel:+12533355630">Call Chris</a><a class="btn line" href="sms:+12533355630">Text</a></div>
</body></html>'''
open(os.path.join(ROOT, 'reviews.html'), 'w').write(page)
print('reviews.html', len(R), 'reviews')
