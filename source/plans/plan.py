"""Personal launch plan: one JSON file per seller -> a private, unlisted page.
Usage: python3 plan.py data/<name>.json  -> writes /home/claude/homes/plan/<token>.html
"""
import json, sys, html, os, datetime

E = lambda s: html.escape(str(s if s is not None else ''))
money = lambda n: '${:,.0f}'.format(n) if n else ''
API = 'https://script.google.com/macros/s/AKfycbz0ALnuwyuwKaRkr2sGS7N_TPJ3DIXYYRiLP7RiNlBvv5HfQMxfy82jS88ihRab7Duu/exec'


def chart(d):
    """Price vs. size scatter, their home highlighted with the recommended range."""
    pts = [c for c in d['comps'] if c.get('price') and c.get('sqft')]
    if len(pts) < 3:
        return ''
    you = d['home']['sqft']
    xs = [c['sqft'] for c in pts] + [you]; ys = [c['price'] for c in pts] + [d['price']['low'], d['price']['high']]
    x0, x1 = min(xs) * 0.94, max(xs) * 1.06; y0, y1 = min(ys) * 0.94, max(ys) * 1.05
    W, H, L, B, T, R = 720, 380, 70, 40, 16, 20
    X = lambda v: L + (v - x0) / (x1 - x0) * (W - L - R)
    Y = lambda v: H - B - (v - y0) / (y1 - y0) * (H - B - T)
    col = {'Sold': '#1E2327', 'Pending': '#8C6A43', 'Active': '#A9A39A'}
    g = []
    for k in range(5):
        v = y0 + (y1 - y0) * k / 4
        g.append(f'<line x1="{L}" x2="{W-R}" y1="{Y(v):.1f}" y2="{Y(v):.1f}" stroke="#E6E0D6"/><text x="{L-10}" y="{Y(v)+4:.1f}" text-anchor="end" font-size="12" fill="#6B655C">${v/1000:,.0f}K</text>')
    for k in range(5):
        v = x0 + (x1 - x0) * k / 4
        g.append(f'<text x="{X(v):.1f}" y="{H-B+22}" text-anchor="middle" font-size="12" fill="#6B655C">{v:,.0f} sq ft</text>')
    g.append(f'<rect x="{X(you)-9:.1f}" y="{Y(d["price"]["high"]):.1f}" width="18" height="{Y(d["price"]["low"])-Y(d["price"]["high"]):.1f}" rx="9" fill="#8C6A43" opacity=".22"/>')
    for c in pts:
        g.append(f'<circle cx="{X(c["sqft"]):.1f}" cy="{Y(c["price"]):.1f}" r="7" fill="{col.get(c["status"],"#999")}"><title>{E(c["address"])}: {money(c["price"])}, {c["sqft"]:,} sq ft ({E(c["status"])})</title></circle>')
    g.append(f'<circle cx="{X(you):.1f}" cy="{Y(d["price"]["recommend"]):.1f}" r="10" fill="#F7F5F1" stroke="#8C6A43" stroke-width="3"/>')
    g.append(f'<text x="{X(you)+16:.1f}" y="{Y(d["price"]["recommend"])+5:.1f}" font-size="13" font-weight="600" fill="#5F4527">Your home</text>')
    legend = ''.join(f'<span><i style="background:{col[s]}"></i>{s}</span>' for s in ['Sold', 'Pending', 'Active'] if any(c['status'] == s for c in pts))
    return f'''<figure class="chart"><svg viewBox="0 0 {W} {H}" role="img" aria-label="Price compared with size for nearby homes, with your home and its recommended range">{"".join(g)}</svg>
<figcaption><span class="lg">{legend}<span><i class="you"></i>Your home · recommended range</span></span></figcaption></figure>'''


def comp_card(c):
    ppsf = round(c['price'] / c['sqft']) if c.get('price') and c.get('sqft') else None
    img = f'<img src="{E(c["photo"])}" alt="{E(c["address"])}" loading="lazy">' if c.get('photo') else ''
    facts = ' · '.join(x for x in [f'{c["beds"]} bd' if c.get('beds') else '', f'{c["baths"]} ba' if c.get('baths') else '', f'{c["sqft"]:,} sq ft' if c.get('sqft') else '', f'${ppsf}/sq ft' if ppsf else ''] if x)
    meta = ' · '.join(x for x in [c.get('date', ''), f'{c["dom"]} days on market' if c.get('dom') is not None else ''] if x)
    return f'''<article class="comp {c['status'].lower()}">{img}<div class="cb"><p class="st">{E(c['status'])}</p><h3>{E(c['address'])}</h3>
<p class="pr">{money(c.get('price'))}</p><p class="fx">{E(facts)}</p>{f'<p class="fx">{E(meta)}</p>' if meta else ''}{f'<p class="nt">{E(c["note"])}</p>' if c.get('note') else ''}</div></article>'''


PREP = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'content', 'prep.json')))


def prep_html():
    cards = ''
    for g in PREP['groups']:
        if g['when'] != 'before':
            continue
        items = ''.join('<li>' + E(i) + '</li>' for i in g['items'])
        note = '<p class="pn">' + E(g['note']) + '</p>' if g.get('note') else ''
        cards += '<div class="pg"><h3>' + E(g['name']) + '</h3><ul>' + items + '</ul>' + note + '</div>'
    return ('<section class="s stone"><div class="wrap"><p class="eyebrow">Before we list</p><h2>' + E(PREP['title']) + '.</h2>'
            '<p class="lede">' + E(PREP['lede']) + ' The same checklist is in your seller portal, where you can tick things off.</p>'
            '<div class="prep">' + cards + '</div></div></section>')


def build(d):
    comps = d['comps']
    groups = [(s, [c for c in comps if c['status'] == s]) for s in ['Sold', 'Pending', 'Active']]
    sold = [c for c in comps if c['status'] == 'Sold' and c.get('price') and c.get('sqft')]
    avg_ppsf = round(sum(c['price'] / c['sqft'] for c in sold) / len(sold)) if sold else None
    you_ppsf = round(d['price']['recommend'] / d['home']['sqft'])
    first = d['sellers'].split(' and ')[0] if ' and ' in d['sellers'] else d['sellers']
    tl = ''.join(f'<li><p class="w">{E(t["when"])}</p><div><h3>{E(t["what"])}</h3><p>{E(t["detail"])}</p></div></li>' for t in d['timeline'])
    hi = ''.join(f'<li>{E(h)}</li>' for h in d['home'].get('highlights', []))
    buyer = ''.join(f'<div class="b"><h3>{E(b["t"])}</h3><p>{E(b["d"])}</p></div>' for b in d['buyer'])
    story = ''.join(f'<p>{E(p)}</p>' for p in d['price']['story'])
    comp_html = ''.join(f'<h3 class="gh">{s} <span>{len(g)}</span></h3><div class="comps">{"".join(comp_card(c) for c in g)}</div>' for s, g in groups if g)
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow, noarchive"><meta name="referrer" content="no-referrer">
<title>Your launch plan · {E(d['address'])} · The Ranch Real Estate Group</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500;600&display=swap">
<style>
:root{{--night:#16191B;--ink:#1E2327;--paper:#F7F5F1;--stone:#ECE7DF;--sand:#E7D7BF;--brass:#8C6A43;--muted:#5F5950;--line:#DCD4C8;--serif:'Playfair Display',Georgia,serif}}
*{{box-sizing:border-box}}html,body{{margin:0;background:var(--paper);color:var(--ink);font:17px/1.6 Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}}
img{{display:block;max-width:100%}}a{{color:var(--brass)}}
.wrap{{max-width:1100px;margin:0 auto;padding:0 clamp(20px,4vw,48px)}}
.eyebrow{{margin:0;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:var(--brass);font-weight:500}}
h1,h2{{font-family:var(--serif);font-weight:400;letter-spacing:-.01em;text-wrap:balance}}
h2{{font-size:clamp(30px,4vw,46px);line-height:1.1;margin:12px 0 0}}h3{{font-size:17px;font-weight:600;margin:0}}
.lede{{font-size:clamp(18px,1.6vw,20px);color:var(--muted);max-width:660px}}
section.s{{padding:clamp(56px,8vw,104px) 0}}section.stone{{background:var(--stone)}}section.dark{{background:var(--night);color:var(--paper)}}
section.dark .eyebrow{{color:var(--sand)}}section.dark .lede,section.dark p{{color:#CFC9C0}}
.hero{{position:relative;min-height:min(82vh,760px);display:flex;align-items:flex-end;background:var(--night);color:var(--paper);overflow:hidden}}
.hero img{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}}
.hero:after{{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,16,18,.5),rgba(14,16,18,.05) 30%,rgba(14,16,18,.88))}}
.hero .c{{position:relative;z-index:1;padding-bottom:clamp(36px,6vw,80px)}}.hero .eyebrow{{color:var(--sand)}}
.hero h1{{font-size:clamp(44px,7vw,96px);line-height:1;margin:14px 0 0}}.hero p.sub{{color:#E8E3DA;font-size:clamp(17px,1.7vw,21px);margin:18px 0 0;max-width:620px}}
.top{{position:absolute;left:0;right:0;top:0;z-index:2;display:flex;justify-content:space-between;padding:22px clamp(20px,4vw,48px);color:var(--paper);font-family:var(--serif);font-size:17px}}
.top{{gap:16px;align-items:baseline}}.top span:first-child{{white-space:nowrap}}.top span:last-child{{font-family:Inter,sans-serif;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--sand);text-align:right}}@media(max-width:560px){{.top span:last-child{{display:none}}}}
.price{{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:clamp(28px,6vw,80px);align-items:start;margin-top:36px}}
.big{{font-family:var(--serif);font-size:clamp(54px,8vw,92px);line-height:1;margin:0}}
.rng{{font-size:15px;color:var(--muted);margin:12px 0 0}}.rng b{{color:var(--ink)}}
.stats{{display:grid;grid-template-columns:repeat(3,1fr);margin-top:30px;border-top:1px solid var(--line)}}
.stats div{{padding:16px 14px 0 0}}.stats .v{{font-family:var(--serif);font-size:30px;line-height:1}}.stats .k{{font-size:13px;color:var(--muted);margin-top:6px}}
.story p{{margin:0 0 14px;color:var(--muted)}}
.chart{{margin:36px 0 0}}.chart svg{{width:100%;height:auto;font-family:Inter,sans-serif}}
.lg{{display:flex;flex-wrap:wrap;gap:8px 22px;font-size:13px;color:var(--muted);margin-top:8px}}.lg span{{display:flex;align-items:center;gap:8px}}
.lg i{{width:11px;height:11px;border-radius:50%;display:inline-block}}.lg i.you{{background:var(--paper);border:3px solid var(--brass);width:13px;height:13px}}
.gh{{margin:44px 0 14px;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:var(--brass);font-weight:500}}.gh span{{color:var(--muted)}}
.comps{{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px}}
.comp{{background:#fff;border-top:3px solid #A9A39A}}.comp.sold{{border-top-color:var(--ink)}}.comp.pending{{border-top-color:var(--brass)}}
.comp img{{width:100%;aspect-ratio:3/2;object-fit:cover}}.cb{{padding:16px 18px 18px}}
.comp .st{{margin:0;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--brass)}}.comp h3{{margin-top:6px}}
.comp .pr{{font-family:var(--serif);font-size:28px;margin:6px 0 0}}.comp .fx{{margin:4px 0 0;font-size:14px;color:var(--muted)}}.comp .nt{{margin:10px 0 0;font-size:14px;border-top:1px solid var(--line);padding-top:10px}}
.hl{{columns:2;column-gap:40px;padding:0;margin:26px 0 0;list-style:none}}.hl li{{break-inside:avoid;padding:10px 0;border-top:1px solid var(--line)}}
.buyers{{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:36px}}.b{{border-top:2px solid var(--brass);padding-top:14px}}.b p{{margin:6px 0 0;color:var(--muted);font-size:15px}}
.steps{{display:grid;grid-template-columns:repeat(5,1fr);border-top:2px solid var(--sand);margin-top:40px}}.step{{padding:22px 18px 0 0}}
.step .n{{font-family:var(--serif);font-size:38px;line-height:1;color:var(--sand);margin:0 0 8px}}.step p{{font-size:14px;margin:4px 0 0}}
ol.tl{{list-style:none;padding:0;margin:36px 0 0}}ol.tl li{{display:grid;grid-template-columns:160px 1fr;gap:24px;padding:18px 0;border-top:1px solid var(--line)}}
ol.tl .w{{margin:0;font-family:var(--serif);font-size:20px}}ol.tl p{{margin:4px 0 0;color:var(--muted);font-size:15px}}
.portal{{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:40px;align-items:center}}.portal .ph{{display:flex;gap:14px;justify-content:center}}.portal .ph img{{width:46%;max-width:230px}}
.chris{{display:grid;grid-template-columns:minmax(0,300px) minmax(0,1fr);gap:clamp(24px,5vw,56px);align-items:center}}.chris img{{width:100%;aspect-ratio:4/5;object-fit:cover}}
.btns{{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}}.btn{{display:inline-flex;align-items:center;min-height:48px;padding:0 22px;background:var(--ink);color:var(--paper);text-decoration:none;font-weight:500;font-size:15px}}.btn.line{{background:transparent;color:inherit;box-shadow:inset 0 0 0 1px currentColor}}
.prep{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px 40px;margin-top:34px}}.pg{{border-top:2px solid var(--brass);padding-top:14px}}.pg ul{{margin:10px 0 0;padding-left:18px;color:var(--muted);font-size:15px}}.pg li{{margin:6px 0}}.pn{{font-size:14px;color:var(--muted);margin:10px 0 0;font-style:italic}}
@media (max-width:820px){{.prep{{grid-template-columns:1fr}}}}
.fine{{font-size:12.5px;color:#6B655C;margin-top:22px;max-width:760px}}
.foot{{padding:40px 0 60px;font-size:13px;color:#5F5950;border-top:1px solid var(--line)}}.foot p{{margin:8px 0 0;max-width:820px}}
@media (max-width:820px){{.price,.portal,.chris{{grid-template-columns:1fr}}.buyers,.steps{{grid-template-columns:1fr}}.step{{border-bottom:1px solid #33393D;padding:16px 0}}.hl{{columns:1}}ol.tl li{{grid-template-columns:1fr;gap:4px}}.stats{{grid-template-columns:1fr 1fr 1fr}}}}
@media print{{.hero{{min-height:520px}}section.s{{padding:40px 0;break-inside:avoid}}.btns{{display:none}}}}
</style></head><body>
<header class="hero"><img src="../{E(d['photo'])}" alt="{E(d['address'])}">
<div class="top"><span>The Ranch Real Estate Group</span><span>Prepared for you · {E(d['prepared'])}</span></div>
<div class="wrap c"><p class="eyebrow">Your launch plan · {E(d['community'])}</p><h1>{E(d['address'])}</h1>
<p class="sub">{E(d['sellers'])}, here's how we'll introduce your home: what it's worth, who will buy it, and exactly what happens from here.</p></div></header>
<main>
<section class="s"><div class="wrap"><p class="eyebrow">Where your home fits</p><h2>Pricing to win the right buyer.</h2>
<div class="price"><div><p class="big">{money(d['price']['recommend'])}</p><p class="rng">Recommended list price · supported range <b>{money(d['price']['low'])}–{money(d['price']['high'])}</b></p>
<div class="stats"><div><p class="v">${you_ppsf}</p><p class="k">per sq ft at this price</p></div>{f'<div><p class="v">${avg_ppsf}</p><p class="k">sold comparables, average</p></div>' if avg_ppsf else ''}<div><p class="v">{d['home']['sqft']:,}</p><p class="k">finished sq ft</p></div></div></div>
<div class="story">{story}</div></div>
{chart(d)}</div></section>
<section class="s stone"><div class="wrap"><p class="eyebrow">The homes buyers will compare</p><h2>Your competition, side by side.</h2>
<p class="lede">The nearby homes that matter most to your price: what's sold, what's under contract, and what buyers can tour today.</p>{comp_html}
<p class="fine">Comparables from {E(d.get('source','NWMLS'))} as of {E(d['prepared'])}. While you're on the market, new listings, pendings and price changes appear in your seller portal.</p></div></section>
<section class="s"><div class="wrap"><p class="eyebrow">What makes it different</p><h2>What we'll lead with.</h2><ul class="hl">{hi}</ul></div></section>
<section class="s stone"><div class="wrap"><p class="eyebrow">Your likely buyer</p><h2>Who we're marketing to.</h2><div class="buyers">{buyer}</div></div></section>
<section class="s dark"><div class="wrap"><p class="eyebrow">How we launch it</p><h2>Five things we do for your home.</h2>
<div class="steps"><div class="step"><p class="n">1</p><h3>Prepare</h3><p>Photography checked against the real rooms, and a story worth reading.</p></div>
<div class="step"><p class="n">2</p><h3>Present</h3><p>A web page for your home alone, built to be shared. Calls and texts reach Chris directly.</p></div>
<div class="step"><p class="n">3</p><h3>Promote</h3><p>Social media, about 600 agents across our 10 offices, NWMLS and the major sites, and print.</p></div>
<div class="step"><p class="n">4</p><h3>Report</h3><p>Your private seller portal: views, posts, showings and feedback, live.</p></div>
<div class="step"><p class="n">5</p><h3>Run</h3><p>Pages checked every morning, paperwork filed, every message approved by Chris.</p></div></div></div></section>
<section class="s"><div class="wrap"><p class="eyebrow">From here</p><h2>Your timeline.</h2><ol class="tl">{tl}</ol></div></section>
{prep_html()}
<section class="s stone"><div class="wrap portal"><div><p class="eyebrow">You'll see everything</p><h2>Your seller portal.</h2>
<p class="lede">The day you list, you get a private link and a code. Showings, feedback, online views, your social posts and the competition, all in one place, always current.</p></div>
<div class="ph"><img src="../marketing/ph-portal-2.webp" alt="Seller portal: your home across the web" loading="lazy"><img src="../marketing/ph-portal-5.webp" alt="Seller portal: market charts" loading="lazy"></div></div></section>
<section class="s"><div class="wrap chris"><img src="../photos/chris-ranch.jpg" alt="Chris Ranch" loading="lazy">
<div><p class="eyebrow">Next step</p><h2>Ready when you are, {E(d['sellers'])}.</h2>
<p class="lede">Questions about the price, the timing or anything in this plan? Call or text me directly.</p>
<p style="margin:14px 0 0"><b>Chris Ranch</b> · The Ranch Real Estate Group · Keller Williams Realty Puget Sound · KW Luxury</p>
<div class="btns"><a class="btn" href="tel:+12533355630">Call (253) 335-5630</a><a class="btn line" href="sms:+12533355630">Text Chris</a></div>
<p class="fine">This comparative market analysis is a broker's opinion of price based on available market data. It is not an appraisal.</p></div></div></section>
</main>
<footer class="foot"><div class="wrap"><p><strong>The Ranch Real Estate Group</strong> · Keller Williams Realty Puget Sound · 33434 8th Ave S, Suite 103, Federal Way, WA 98003 · Each Office Is Independently Owned and Operated. Equal Housing Opportunity.</p>
<p>Prepared privately for {E(d['sellers'])}. Please don't forward this link.</p></div></footer>
<script>try{{fetch('{API}',{{method:'POST',headers:{{'Content-Type':'text/plain'}},body:JSON.stringify({{type:'visit',view:'plan',page:'plan-{E(d['token'])}',source:'plan'}})}})}}catch(e){{}}</script>
</body></html>'''


if __name__ == '__main__':
    d = json.load(open(sys.argv[1]))
    out = f'/home/claude/homes/plan/{d["token"]}.html'
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w').write(build(d))
    print(out)
