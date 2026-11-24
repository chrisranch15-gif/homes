#!/usr/bin/env python3
"""Town guide builder: source/guides/<slug>.json -> guides/<slug>.html + guides/index.html.

  python3 source/guides/build_guides.py                 # published guides -> guides/ (+ index)
  python3 source/guides/build_guides.py --drafts OUTDIR # every guide with status "draft" -> OUTDIR/<slug>.html
                                                        # (noindex, images inlined, for private review)

Drafts never go into guides/, guides/index.html, sitemap.xml or llms.txt. Design: unlisted.html / reviews.html
(Playfair Display + Inter, ivory / charcoal / stone, bronze #8C6A43). Schema: SCHEMA.md.
"""
import base64, html, json, os, sys, glob

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
SITE = 'https://homes.ranchpnw.com'
PHONE, TEL = '(253) 335-5630', '+12533355630'
AGENT, TEAM = 'Chris Ranch', 'The Ranch Real Estate Group'
e = lambda s: html.escape(str(s or ''), quote=True)


def load():
    out = []
    for f in sorted(glob.glob(os.path.join(HERE, '*.json'))):
        d = json.load(open(f, encoding='utf-8'))
        check(d)
        out.append(d)
    return out


def check(d):
    keys = set(d['sources'])
    used = [x[2] for x in d['stats'] + d['glance'] + d['faq'] if len(x) > 2 and x[2]]
    for c in d['chapters']:
        used += [x[2] for x in c.get('items', []) if len(x) > 2 and x[2]]
        used += [x[3] for x in c.get('moments', []) if x[3]]
    missing = sorted(set(used) - keys)
    if missing:
        sys.exit(f"{d['slug']}: source keys missing: {missing}")


def fmt_day(iso):
    import datetime
    dt = datetime.date.fromisoformat(iso)
    return dt.strftime('%B ') + str(dt.day) + dt.strftime(', %Y')


CSS = """
:root{--night:#16191B;--ink:#1E2327;--paper:#F7F5F1;--stone:#ECE7DF;--sand:#E7D7BF;--brass:#8C6A43;--muted:#5F5950;--line:#DCD4C8;--serif:'Playfair Display',Georgia,serif}
*{box-sizing:border-box}html{scroll-behavior:smooth}
html,body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.65 Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--brass)}img{display:block;max-width:100%}
.wrap{max-width:1180px;margin:0 auto;padding:0 clamp(20px,4vw,48px)}.narrow{max-width:820px}
.eyebrow{margin:0;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:var(--brass);font-weight:500}
h1,h2,h3{font-family:var(--serif);font-weight:400;letter-spacing:-.01em;text-wrap:balance}
h2{font-size:clamp(32px,4.2vw,52px);line-height:1.06;margin:12px 0 0}
p{text-wrap:pretty}
.draftbar{background:#8C6A43;color:#fff;font-size:14px;text-align:center;padding:10px 16px;letter-spacing:.02em}
.hero{position:relative;background:radial-gradient(120% 90% at 78% 8%,#2A3136 0%,#16191B 55%,#0F1113 100%);color:var(--paper);overflow:hidden}
.hero:before{content:"";position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(231,215,191,.5),transparent)}
.top{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:22px clamp(20px,4vw,48px)}
.top .mark{font-family:var(--serif);font-size:18px;color:var(--paper);text-decoration:none}
.top a.cta{color:var(--paper);text-decoration:none;font-size:14px;letter-spacing:.06em;border:1px solid rgba(247,245,241,.55);padding:10px 16px;white-space:nowrap}
.hero .c{padding-top:clamp(60px,10vw,130px);padding-bottom:clamp(48px,7vw,96px)}
.badge{display:inline-block;margin:0;font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--sand);border:1px solid rgba(231,215,191,.4);padding:9px 14px}
.hero h1{font-size:clamp(46px,7.4vw,104px);line-height:.98;margin:22px 0 0;max-width:13ch}
.hero p.sub{font-family:var(--serif);font-style:italic;font-size:clamp(20px,2.2vw,28px);color:var(--sand);max-width:34ch;margin:26px 0 0}
.hero p.sub:after{content:"";display:block;width:64px;height:1px;background:var(--brass);margin-top:20px}
.hero p.by{margin:18px 0 0;font-size:14px;color:#B9B3AA}
.lede{padding:clamp(56px,8vw,104px) 0 0}
.lede p.big{font-family:var(--serif);font-size:clamp(21px,2.1vw,27px);line-height:1.45;margin:0}
.stats{display:grid;grid-template-columns:repeat(4,1fr);margin-top:clamp(40px,6vw,72px);border-top:2px solid var(--brass)}
.stats div{padding:24px 22px 0 0}.stats div+div{padding-left:22px;border-left:1px solid var(--line)}
.stats .v{margin:0;font-family:var(--serif);font-size:clamp(34px,4vw,54px);line-height:1;color:var(--brass)}
.stats .k{margin:10px 0 0;font-size:14px;line-height:1.5;color:var(--muted)}
.src{font-size:12px;letter-spacing:.04em;color:var(--muted);text-decoration:none;border-bottom:1px solid var(--line)}
.src:hover{color:var(--brass);border-color:var(--brass)}
.glance{margin-top:clamp(40px,6vw,64px);background:var(--stone);padding:clamp(24px,3vw,36px)}
.glance dl{margin:16px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:0 36px}
.glance dl div{padding:12px 0;border-top:1px solid var(--line)}
.glance dt{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.glance dd{margin:4px 0 0}
.toc{display:flex;flex-wrap:wrap;gap:8px;margin-top:28px}
.toc a{font-size:14px;text-decoration:none;color:var(--ink);border:1px solid var(--line);padding:8px 14px}
.toc a:hover{border-color:var(--brass);color:var(--brass)}
.notes{margin-top:20px;font-size:14px;color:var(--muted);max-width:76ch}
section.ch{padding:clamp(64px,9vw,120px) 0}
section.ch.dark{background:var(--night);color:var(--paper)}
section.ch.dark .eyebrow,section.ch.dark .n{color:var(--sand)}
section.ch.dark .intro,section.ch.dark .item p{color:#CFC9C0}
section.ch.dark .src{color:#B9B3AA;border-color:#3A4045}
section.ch.stone{background:var(--stone)}
.head{display:flex;gap:22px;align-items:baseline}
.head .n{font-family:var(--serif);font-size:clamp(28px,3vw,40px);color:var(--brass)}
.head h2{margin:0}
.intro{font-family:var(--serif);font-size:clamp(19px,1.8vw,23px);line-height:1.5;max-width:60ch;margin:22px 0 0;color:#3B3A36}
.items{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 clamp(28px,5vw,72px);margin-top:40px}
.item{padding:22px 0;border-top:1px solid var(--line)}
section.ch.dark .item{border-color:#3A4045}
.item h3{font-size:clamp(21px,2vw,25px);margin:0 0 8px;line-height:1.2}
.item p{margin:0 0 8px;color:#3B3A36}
.item figure{margin:14px 0 0}.item figure img{width:100%;aspect-ratio:16/10;object-fit:cover}
figcaption{margin-top:8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.sig{font-family:var(--serif);font-style:italic;color:var(--brass);margin-top:28px}
.moments{margin-top:40px;border-top:2px solid var(--brass)}
.moment{display:grid;grid-template-columns:160px minmax(0,1fr);gap:24px;padding:22px 0;border-bottom:1px solid var(--line)}
.moment .when{font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--brass);padding-top:6px}
.moment h3{margin:0 0 6px;font-size:23px}.moment p{margin:0 0 6px}
.honest{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:40px}
.honest div{background:var(--paper);padding:26px 28px;border-top:2px solid var(--brass)}
section.ch.stone .honest div{background:var(--paper)}
.honest h3{margin:0 0 10px;font-size:23px}.honest p{margin:0;color:#3B3A36}
.soon{margin-top:28px;padding:28px 30px;border:1px dashed var(--brass);font-family:var(--serif);font-size:clamp(20px,2vw,25px)}
.faq{margin-top:36px;border-top:1px solid var(--line)}
.qa{border-bottom:1px solid var(--line)}
.qa summary{cursor:pointer;list-style:none;padding:22px 40px 22px 0;position:relative;font-family:var(--serif);font-size:clamp(19px,1.9vw,23px);line-height:1.3}
.qa summary::-webkit-details-marker{display:none}
.qa summary:after{content:"+";position:absolute;right:4px;top:18px;font-family:Inter,sans-serif;font-size:24px;color:var(--brass);transition:transform .3s}
.qa[open] summary:after{transform:rotate(45deg)}
.qa .a{margin:0 0 22px;color:var(--muted);max-width:680px}.qa .a p{margin:0 0 6px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:16px;margin-top:36px}
.card{background:var(--paper);padding:26px 28px;display:flex;flex-direction:column;gap:8px;text-decoration:none;color:var(--ink);border-top:2px solid var(--brass)}
.card .t{font-family:var(--serif);font-size:25px;line-height:1.2}.card .d{color:var(--muted);font-size:15px}
.card .go{margin-top:auto;padding-top:10px;font-size:14px;letter-spacing:.06em;color:var(--brass)}
.btns{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 24px;font:500 15px Inter,sans-serif;letter-spacing:.03em;text-decoration:none;background:var(--paper);color:var(--ink)}
.btn.line{background:transparent;color:var(--paper);box-shadow:inset 0 0 0 1px currentColor}
.close{background:var(--night);color:var(--paper);padding:clamp(72px,10vw,128px) 0}
.close .eyebrow{color:var(--sand)}.close p{color:#CFC9C0;max-width:60ch}
.sources ol{margin:24px 0 0;padding-left:22px;columns:2;column-gap:48px;font-size:14px;color:var(--muted)}
.sources li{break-inside:avoid;margin:0 0 8px}
.foot{background:var(--paper);padding:44px 0 110px;font-size:13px;color:#5F5950;border-top:1px solid var(--line)}
.foot .brands{display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-size:12px;letter-spacing:.2em}
.foot p{margin:12px 0 0;max-width:820px}
.eho-row{display:flex;gap:12px;align-items:flex-start}.eho{width:28px;height:28px;flex:none;color:#5F5950}
.mbar{position:fixed;left:12px;right:12px;bottom:12px;z-index:5;display:none;gap:8px;padding:8px;background:var(--night)}
.mbar .btn{min-height:46px;flex:1}
.list{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:20px;margin-top:40px}
.list a{display:flex;flex-direction:column;justify-content:flex-end;min-height:260px;padding:28px;background:var(--night);color:var(--paper);text-decoration:none}
.list a .eyebrow{color:var(--sand)}.list a h3{font-size:34px;margin:8px 0 6px}.list a p{margin:0;color:#CFC9C0;font-size:15px}
@media (max-width:860px){
 .stats{grid-template-columns:1fr 1fr}.stats div,.stats div+div{padding:18px 14px 0 0;border-left:0}
 .glance dl,.items,.honest{grid-template-columns:1fr}.moment{grid-template-columns:1fr;gap:4px}
 .sources ol{columns:1}.mbar{display:flex}.top a.cta{display:none}
}
"""

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500;600&display=swap">')

FOOT = f"""<footer class="foot"><div class="wrap"><div class="brands"><span>THE RANCH REAL ESTATE GROUP</span><span>·</span><span>Keller Williams Realty Puget Sound</span></div>
<p><strong>Keller Williams Realty Puget Sound</strong><br>33434 8th Ave S, Suite 103, Federal Way, WA 98003<br>Each Office Is Independently Owned and Operated.</p>
<p><a href="https://www.ranchpnw.com" rel="noopener">RanchPNW.com</a> · <a href="{SITE}/">Homes for sale</a> · <a href="{SITE}/unlisted">Unlisted</a> · <a href="{SITE}/guides/">Town guides</a></p>
<p class="eho-row"><svg class="eho" viewBox="0 0 64 64" role="img" aria-label="Equal Housing Opportunity"><path d="M32 6 4 26h7v30h42V26h7z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"></path><rect x="21" y="32" width="22" height="5" fill="currentColor"></rect><rect x="21" y="42" width="22" height="5" fill="currentColor"></rect></svg><span>Equal Housing Opportunity. We are pledged to the letter and spirit of U.S. policy for the achievement of equal housing opportunity throughout the Nation. <a href="https://www.hud.gov/program_offices/fair_housing_equal_opp" rel="noopener" target="_blank">Fair housing</a></span></p>
<p>Chris Ranch, The Ranch Real Estate Group, is a licensed real estate broker with Keller Williams Realty Puget Sound. © 2026 The Ranch Real Estate Group.</p>
</div></footer>
<div class="mbar"><a class="btn" href="tel:{TEL}">Call Chris</a><a class="btn line" href="sms:{TEL}">Text</a></div>"""


class Page:
    def __init__(self, d, draft, inline):
        self.d, self.draft, self.inline = d, draft, inline
        self.order = []  # source keys in order of first citation

    def src(self, k):
        if not k:
            return ''
        if k not in self.order:
            self.order.append(k)
        n = self.order.index(k) + 1
        label, url = self.d['sources'][k]
        return f' <a class="src" href="{e(url)}" rel="noopener" target="_blank" title="{e(label)}">[{n}]</a>'

    def img(self, key):
        if not key:
            return ''
        path, alt, credit = self.d.get('photos', {})[key]
        if self.inline:
            raw = open(os.path.join(REPO, path), 'rb').read()
            mime = 'image/webp' if path.endswith('.webp') else 'image/jpeg'
            srcv = f'data:{mime};base64,' + base64.b64encode(raw).decode()
        else:
            srcv = '/' + path
        return f'<figure><img src="{srcv}" alt="{e(alt)}" loading="lazy"><figcaption>{e(credit)}</figcaption></figure>'

    def chapter(self, i, c):
        n = f'{i + 1:02d}'
        cls = 'dark' if c.get('dark') else ('stone' if c.get('kind') else '')
        head = f'<div class="head"><span class="n">{n}</span><h2>{e(c["title"])}</h2></div>'
        if c.get('kind') == 'picks':
            items = ''.join(f'<div class="item"><h3>{e(a)}</h3><p>{e(b)}</p>{self.src(s)}{self.img(ph)}</div>' for a, b, s, ph in c['items'])
            body = f'<p class="intro">{e(c["intro"])}</p><div class="items">{items}</div><p class="sig">— {AGENT}, first-hand</p>'
        elif c.get('kind') == 'day':
            mo = ''.join(f'<div class="moment"><div class="when">{e(w)}</div><div><h3>{e(t)}</h3><p>{e(x)}{self.src(s)}</p>{self.img(ph)}</div></div>' for w, t, x, s, ph in c['moments'])
            ho = ''.join(f'<div><h3>{e(t)}</h3><p>{e(x)}</p></div>' for t, x in c.get('honest', []))
            body = (f'<p class="eyebrow" style="margin-top:18px">{e(c.get("kicker"))}</p><p class="intro">{e(c["intro"])}</p>'
                    f'<div class="moments">{mo}</div><p class="sig">— {AGENT}, {e(c.get("sig"))}</p><div class="honest">{ho}</div>')
        else:
            items = ''.join(f'<div class="item"><h3>{e(a)}</h3><p>{e(b)}{self.src(s)}</p></div>' for a, b, s in c['items'])
            body = f'<p class="intro">{e(c["intro"])}</p><div class="items">{items}</div>'
        return f'<section class="ch {cls}" id="ch-{i + 1}"><div class="wrap">{head}{body}</div></section>'

    def render(self):
        d = self.d
        name, slug = d['name'], d['slug']
        url = f'{SITE}/guides/{slug}'
        checked = fmt_day(d['checked'])
        title = f'Living in {name}, WA: a local guide · {AGENT}, {TEAM}'
        desc = d['lede'][:300]
        has_picks = any(c.get('kind') == 'picks' for c in d['chapters'])
        toc = ''.join(f'<a href="#ch-{i + 1}">{e(c["title"])}</a>' for i, c in enumerate(d['chapters']))
        nch = len(d['chapters'])
        picks_sec = ''
        if not has_picks:
            picks_sec = (f'<section class="ch stone" id="picks"><div class="wrap"><div class="head"><span class="n">{nch + 1:02d}</span><h2>Local picks</h2></div>'
                         f'<div class="soon">Chris’s local picks are coming soon.</div></div></section>')
            toc += '<a href="#picks">Local picks</a>'
        toc += '<a href="#faq">Questions</a>'
        stats = ''.join(f'<div><p class="v">{e(v)}</p><p class="k">{e(k)}{self.src(s)}</p></div>' for v, k, s in d['stats'])
        glance = ''.join(f'<div><dt>{e(k)}</dt><dd>{e(v)}{self.src(s)}</dd></div>' for k, v, s in d['glance'])
        chapters = [self.chapter(i, c) for i, c in enumerate(d['chapters'])]
        notes = ''.join(f'<p class="notes">{e(x)}</p>' for x in d.get('notes', []))
        faq = ''.join(f'<details class="qa"><summary>{e(q)}</summary><div class="a"><p>{e(a)}{self.src(s)}</p></div></details>' for q, a, s in d['faq'])
        cards = ''.join(f'<a class="card" href="{e(x["url"])}"><span class="eyebrow">{e(x["eyebrow"])}</span><span class="t">{e(x["title"])}</span><span class="d">{e(x["desc"])}</span><span class="go">See the home →</span></a>' for x in d.get('listings', []))
        cards += ''.join(f'<a class="card" href="{e(x["url"])}"><span class="eyebrow">Nearby</span><span class="t">{e(x["title"])}</span><span class="go">Read the guide →</span></a>' for x in d.get('related', []))
        cards += (f'<a class="card" href="{SITE}/unlisted"><span class="eyebrow">Off market</span><span class="t">Unlisted</span>'
                  f'<span class="d">Looking in {e(name)}? Some homes change hands before they ever reach the market.</span><span class="go">How Unlisted works →</span></a>')
        # sources list in citation order (render after body so every citation is counted)
        body_mid = ''.join(chapters) + picks_sec
        faq_html = f'<section class="ch" id="faq"><div class="wrap narrow"><p class="eyebrow">Questions</p><h2>{e(name)} questions, answered</h2><div class="faq">{faq}</div></div></section>'
        for k in d['sources']:
            if k not in self.order:
                self.order.append(k)
        srcs = ''.join(f'<li id="src-{i + 1}"><a href="{e(d["sources"][k][1])}" rel="noopener" target="_blank">{e(d["sources"][k][0])}</a></li>' for i, k in enumerate(self.order))
        robots = '<meta name="robots" content="noindex, nofollow">' if self.draft else '<meta name="robots" content="index, follow, max-image-preview:large">'
        draftbar = (f'<div class="draftbar">Private draft for Chris’s review · not published · reply “approve {e(slug)}” to publish</div>' if self.draft else '')
        ld = json.dumps(self.jsonld(url, desc), ensure_ascii=False).replace('</', '<\\/')
        return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
{robots}
<link rel="canonical" href="{url}">
<meta property="og:type" content="article"><meta property="og:site_name" content="{TEAM}">
<meta property="og:title" content="Living in {e(name)}, Washington"><meta property="og:description" content="{e(d['headline'])}"><meta property="og:url" content="{url}">
{FONTS}
<style>{CSS}</style>
<script type="application/ld+json">{ld}</script>
</head>
<body>
{draftbar}
<header class="hero">
<div class="top"><a class="mark" href="{SITE}/">{TEAM}</a><a class="cta" href="tel:{TEL}">Call or text {PHONE}</a></div>
<div class="wrap c"><p class="badge">{e(name)} · {e(d['county'])}, Washington</p>
<h1>Living in {e(name)}</h1><p class="sub">{e(d['headline'])}</p>
<p class="by">A local guide from {AGENT}, {TEAM}. Updated {checked}.</p></div>
</header>
<main>
<section class="lede"><div class="wrap"><div class="narrow"><p class="big">{e(d['lede'])}</p></div>
<div class="stats">{stats}</div>
<div class="glance"><p class="eyebrow">{e(name)} at a glance</p><dl>{glance}</dl></div>
{notes}
<nav class="toc" aria-label="In this guide">{toc}</nav></div></section>
{body_mid}
{faq_html}
<section class="ch stone"><div class="wrap"><p class="eyebrow">Homes and help</p><h2>Thinking about {e(name)}?</h2><div class="cards">{cards}</div></div></section>
<section class="close"><div class="wrap"><p class="eyebrow">Ask a local question</p><h2>Call or text Chris</h2>
<p>About a neighborhood, a commute, a school boundary or a home you’ve seen.</p>
<div class="btns"><a class="btn" href="tel:{TEL}">Call {PHONE}</a><a class="btn line" href="sms:{TEL}">Text Chris</a></div></div></section>
<section class="ch sources" id="sources"><div class="wrap"><p class="eyebrow">Sources</p><h2 style="font-size:clamp(26px,3vw,36px)">Where these facts come from</h2>
<p class="notes">{e(d.get('fine'))} Sources were checked on {checked}.</p><ol>{srcs}</ol></div></section>
</main>
{FOOT}
</body>
</html>
"""

    def jsonld(self, url, desc):
        d = self.d
        org = {'@type': 'RealEstateAgent', '@id': 'https://www.ranchpnw.com/#org', 'name': TEAM, 'url': 'https://www.ranchpnw.com', 'telephone': '+1-253-335-5630'}
        loc = lambda st: dict({'@type': 'PostalAddress', 'addressLocality': d['name'], 'addressRegion': 'WA', 'addressCountry': 'US'}, **({'streetAddress': st} if st else {}))
        contains = [{'@type': t, 'name': n, 'address': loc(st)} for t, n, st in d.get('ld_places', [])]
        wiki = next((u for _, u in d['sources'].values() if 'wikipedia.org' in u), None)
        place = {'@type': 'Place', '@id': url + '#place', 'name': f"{d['name']}, Washington",
                 'containedInPlace': {'@type': 'AdministrativeArea', 'name': f"{d['county']}, Washington"}}
        if wiki:
            place['sameAs'] = wiki
        if contains:
            place['containsPlace'] = contains
        return {'@context': 'https://schema.org', '@graph': [
            {'@type': 'Article', '@id': url + '#guide', 'headline': f"Living in {d['name']}, WA: a local guide", 'description': desc, 'url': url,
             'inLanguage': 'en-US', 'datePublished': d['checked'], 'dateModified': d['checked'],
             'author': {'@type': 'Person', 'name': AGENT, 'worksFor': {'@id': org['@id']}}, 'publisher': org, 'about': {'@id': url + '#place'},
             'citation': [u for _, u in d['sources'].values()]},
            place,
            {'@type': 'FAQPage', '@id': url + '#faq', 'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a, _ in d['faq']]},
            {'@type': 'BreadcrumbList', 'itemListElement': [
                {'@type': 'ListItem', 'position': 1, 'name': TEAM, 'item': SITE + '/'},
                {'@type': 'ListItem', 'position': 2, 'name': 'Town guides', 'item': SITE + '/guides/'},
                {'@type': 'ListItem', 'position': 3, 'name': d['name'], 'item': url}]}]}


def index_page(pub):
    cards = ''.join(f'<a href="/guides/{e(d["slug"])}"><span class="eyebrow">{e(d["county"])}</span><h3>{e(d["name"])}</h3><p>{e(d["headline"])}</p></a>' for d in pub)
    cards += '<a href="https://gotehaleh.com/"><span class="eyebrow">Bonney Lake</span><h3>Tehaleh</h3><p>The full Tehaleh guide, at gotehaleh.com.</p></a>'
    ld = {'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': 'Town guides · ' + TEAM, 'url': SITE + '/guides/',
          'hasPart': [{'@type': 'Article', 'name': f"Living in {d['name']}, WA", 'url': f"{SITE}/guides/{d['slug']}"} for d in pub]}
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Town guides · Puget Sound · {AGENT}, {TEAM}</title>
<meta name="description" content="Sourced local guides to Puget Sound towns from {AGENT} and {TEAM}: commutes, parks, schools, errands and neighborhoods.">
<link rel="canonical" href="{SITE}/guides/">{FONTS}<style>{CSS}</style>
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script></head>
<body><header class="hero"><div class="top"><a class="mark" href="{SITE}/">{TEAM}</a><a class="cta" href="tel:{TEL}">Call or text {PHONE}</a></div>
<div class="wrap c"><p class="badge">Puget Sound, Washington</p><h1>Town guides</h1><p class="sub">Know the place before you live there.</p></div></header>
<main><section class="ch"><div class="wrap"><div class="list">{cards}</div></div></section></main>
{FOOT}</body></html>
"""


def main():
    guides = load()
    if len(sys.argv) > 2 and sys.argv[1] == '--drafts':
        out = sys.argv[2]
        os.makedirs(out, exist_ok=True)
        for d in guides:
            if d['status'] == 'draft':
                open(os.path.join(out, d['slug'] + '.html'), 'w', encoding='utf-8').write(Page(d, True, True).render())
                print('draft', d['slug'])
        return
    pub = [d for d in guides if d['status'] == 'published']
    if not pub:
        print('no published guides yet; nothing written to guides/')
        return
    gdir = os.path.join(REPO, 'guides')
    os.makedirs(gdir, exist_ok=True)
    for d in pub:
        open(os.path.join(gdir, d['slug'] + '.html'), 'w', encoding='utf-8').write(Page(d, False, False).render())
        print('published', d['slug'])
    open(os.path.join(gdir, 'index.html'), 'w', encoding='utf-8').write(index_page(pub))


if __name__ == '__main__':
    main()
