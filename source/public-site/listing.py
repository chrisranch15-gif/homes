"""Builds a listing page for any home from source/listings/<key>.json and its photos in photos/<key>/.
   python3 source/public-site/listing.py 11532   ->  <key>.html at the site root (homes.ranchpnw.com/<key>)
   Agent details come from AGENT, never from the page, so other agents can reuse it."""
import html, json, os, sys
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
API = 'https://script.google.com/macros/s/AKfycbz0ALnuwyuwKaRkr2sGS7N_TPJ3DIXYYRiLP7RiNlBvv5HfQMxfy82jS88ihRab7Duu/exec'
AGENT = {'name': 'Chris Ranch', 'team': 'The Ranch Real Estate Group', 'phone': '(253) 335-5630', 'tel': '2533355630',
         'brokerage': 'Keller Williams Realty Puget Sound', 'photo': 'photos/chris-ranch-800.webp', 'origin': 'https://homes.ranchpnw.com'}
E = html.escape

def build(key):
    L = json.load(open(os.path.join(R, 'source/listings', key + '.json')))
    P = {p['slug']: p for p in json.load(open(os.path.join(R, 'photos', key, 'index.json')))['photos']}
    ph = lambda s, w='': f'photos/{key}/{s}{"-800" if w else ""}.webp'
    title_of = lambda s: P[s]['title'] if s in P else s
    A = AGENT; addr = L['address']; place = f"{L['city']}, {L['state']}"
    price = '${:,.0f}'.format(L['price']); land = L.get('kind') == 'land'
    soon = not L.get('mls')  # not on NWMLS yet: private preview, noindex, no MLS number
    sq = L.get('sqft') if not L.get('sqft_note') else None  # sqft_note = sources disagree; stays hidden until confirmed
    facts = [f"{L['acres']} acres", L.get('parcels_note', '')] if land else [f"{L['beds']} bed", f"{L['baths']} bath", '{:,} sq ft'.format(sq) if sq else '']
    facts = [f for f in facts if f]
    spec = (''.join(f'<div><b>{E(str(v))}</b><span>{E(k)}</span></div>' for k, v in L['spec']) if land else
            f"<div><b>{L['beds']}</b><span>Bedrooms</span></div><div><b>{E(str(L['baths']))}</b><span>Baths</span></div>" + (f"<div><b>{'{:,}'.format(sq)}</b><span>Square feet</span></div>" if sq else '')) + f"<div><b>{price}</b><span>{'Coming soon' if soon else 'MLS #' + E(L['mls'])}</span></div>"
    story = ''.join(f'<p>{E(x)}</p>' for x in L.get('story', []))
    details = ''.join(f'<div><dt>{E(k)}</dt><dd>{E(v)}</dd></div>' for k, v in L.get('details', []))
    more = (f'<div class="story">{story}</div>' if story else '') + (f'<dl class="dets">{details}</dl>' if details else '')
    url = f"{A['origin']}/{key}"
    desc = f"{addr}, {place}: {', '.join(facts)}, listed at {price}. {L['lede']} Presented by {A['name']}, {A['team']}."
    order = [s for _, g in L['groups'] for s in g if s in P]
    gal = ''.join(f'<section class="g"><h3>{E(name)}</h3><div class="grid">' + ''.join(
        f'<button type="button" class="ph" data-i="{order.index(s)}" aria-label="Open photo: {E(title_of(s))}"><img loading="lazy" src="{ph(s, 1)}" alt="{E(title_of(s))}"></button>'
        for s in g if s in P) + '</div></section>' for name, g in L['groups'])
    feats = ''.join(f'<li><button type="button" class="ft" data-i="{order.index(s) if s in order else 0}"><img loading="lazy" src="{ph(s, 1)}" alt=""><span>{E(t)}</span></button></li>' for t, s in L['features'])
    credit = f'<p class="credit">Photos: {E(L["credit"])}</p>' if L.get('credit') else ''
    cfg = json.dumps({'api': API, 'key': key, 'listing': addr, 'photos': [{'src': ph(s), 'alt': title_of(s)} for s in order]})
    ld = json.dumps({'@context': 'https://schema.org', '@type': L.get('type', 'SingleFamilyResidence'), 'name': addr, 'url': url,
                     'address': {'@type': 'PostalAddress', 'streetAddress': addr, 'addressLocality': L['city'], 'addressRegion': L['state']},
                     **({} if land else {'numberOfRooms': L['beds'], **({'floorSize': {'@type': 'QuantitativeValue', 'value': sq, 'unitCode': 'FTK'}} if sq else {})}),
                     'image': f"{A['origin']}/photos/{key}/{L['hero']}.jpg"})
    page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{E(addr)}, {E(place)} · {price} · {E(A['team'])}</title>
<meta name="description" content="{E(desc)}"><link rel="canonical" href="{url}">{'<meta name="robots" content="noindex,nofollow">' if soon else ''}
<meta property="og:type" content="website"><meta property="og:site_name" content="{E(A['team'])}"><meta property="og:title" content="{E(addr)} · {price}">
<meta property="og:description" content="{E(desc)}"><meta property="og:url" content="{url}">{('<meta property="og:image" content="' + A['origin'] + '/photos/og-' + key + '.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">') if os.path.exists(os.path.join(R, 'photos', 'og-' + key + '.jpg')) else ('<meta property="og:image" content="' + A['origin'] + '/photos/' + key + '/' + L['hero'] + '.jpg">')}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%2316191B'/%3E%3Ctext x='32' y='44' font-family='Georgia' font-size='36' fill='%23D9C2A0' text-anchor='middle'%3ER%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script type="application/ld+json">{ld}</script>
<style>
:root{{--night:#16191B;--paper:#F7F5F1;--stone:#ECE7DF;--sand:#E7D7BF;--gold:#C9A877;--brass:#7A5C38;--muted:#5F5950;--line:#DCD4C8;--serif:'Playfair Display',Georgia,serif}}
*{{box-sizing:border-box}}html,body{{margin:0;background:var(--paper);color:#1E2327;font:16px/1.55 Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}}
img{{display:block;max-width:100%}}a{{color:inherit}}.wrap{{max-width:1120px;margin:0 auto;padding:0 clamp(18px,4vw,40px)}}
.eb{{font-size:12px;letter-spacing:.22em;text-transform:uppercase;font-weight:600;color:var(--brass)}}
h1,h2,h3{{font-family:var(--serif);font-weight:400;margin:0;letter-spacing:-.01em}}
.hero{{position:relative;height:min(82vh,760px);min-height:460px;color:#fff;background:var(--night)}}
.hero img{{width:100%;height:100%;object-fit:cover}}.hero:after{{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,12,13,.35) 0,rgba(10,12,13,0) 30%,rgba(10,12,13,0) 45%,rgba(10,12,13,.85) 100%)}}
.top{{position:absolute;z-index:2;left:0;right:0;top:0;padding:20px 0}}.top .wrap{{display:flex;justify-content:space-between;align-items:center;gap:12px}}
.brand{{font-family:var(--serif);font-size:18px}}.top a.call{{white-space:nowrap;font-size:14px;font-weight:500;text-decoration:none;border:1px solid rgba(255,255,255,.6);padding:8px 14px;border-radius:999px}}
.hc{{position:absolute;z-index:2;left:0;right:0;bottom:0;padding-bottom:clamp(26px,5vw,48px)}}
.hc .eb{{color:var(--sand)}}.hc h1{{font-size:clamp(38px,6.5vw,72px);line-height:1.02;margin-top:10px}}
.hc .place{{font-size:18px;color:#EDE8E0;margin-top:6px}}.row{{display:flex;flex-wrap:wrap;gap:10px 26px;align-items:baseline;margin-top:18px}}
.price{{font-family:var(--serif);font-size:clamp(28px,4vw,40px)}}.facts{{font-size:16px;color:#EDE8E0}}
.btn{{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 24px;border-radius:999px;font:inherit;font-weight:600;font-size:15px;border:0;cursor:pointer;text-decoration:none}}
.btn.gold{{background:var(--gold);color:var(--night)}}.btn.dark{{background:var(--night);color:#fff}}.btn.line{{background:transparent;border:1px solid currentColor}}
.ctas{{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}}
section.s{{padding:clamp(46px,7vw,84px) 0;border-top:1px solid var(--line)}}
.lede{{font-family:var(--serif);font-size:clamp(24px,3.2vw,34px);line-height:1.3;max-width:820px;margin:14px 0 0}}
.spec{{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-top:1px solid #1E2327;border-bottom:1px solid #1E2327;margin-top:34px}}
.story{{max-width:760px;margin-top:30px;font-size:17px;line-height:1.7;color:#2B2F33}}.story p{{margin:0 0 14px}}.dets{{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:0 28px;margin:26px 0 0;max-width:980px}}.dets div{{border-bottom:1px solid var(--line);padding:10px 0}}.dets dt{{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}}.dets dd{{margin:2px 0 0;font-size:16px}}
.spec div{{padding:16px 12px 16px 0}}.spec b{{display:block;font-family:var(--serif);font-weight:400;font-size:28px}}.spec span{{font-size:13px;color:var(--muted)}}
ul.feats{{list-style:none;padding:0;margin:30px 0 0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}}ul.feats.n4{{grid-template-columns:repeat(4,minmax(0,1fr))}}
.ft{{all:unset;cursor:pointer;display:block}}.ft img{{aspect-ratio:4/3;object-fit:cover;width:100%;border-radius:4px}}.ft span{{display:block;margin-top:10px;font-weight:500}}
.ft:focus-visible,.ph:focus-visible{{outline:2px solid var(--brass);outline-offset:3px}}
.g{{margin-top:30px}}.g h3{{font-size:24px;margin-bottom:14px}}.grid{{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}}
.ph{{all:unset;cursor:zoom-in;display:block}}.ph img{{aspect-ratio:3/2;object-fit:cover;width:100%;border-radius:3px}}
.dark{{background:var(--night);color:#F2EFEA}}.dark .eb{{color:var(--gold)}}
form{{display:grid;gap:12px;max-width:620px;margin-top:22px}}.two{{display:grid;grid-template-columns:1fr 1fr;gap:12px}}
label{{display:grid;gap:6px;font-size:14px;font-weight:500}}
input,select,textarea{{font:inherit;font-size:16px;padding:12px 14px;border-radius:8px;border:1px solid #4A4F52;background:#202528;color:#fff}}
.tabs{{display:flex;gap:6px;flex-wrap:wrap;margin-top:22px}}.tab{{font:inherit;font-size:14px;font-weight:500;padding:9px 16px;border-radius:999px;border:1px solid #4A4F52;background:transparent;color:#F2EFEA;cursor:pointer}}
.tab[aria-selected=true]{{background:var(--gold);color:var(--night);border-color:var(--gold)}}
.note{{font-size:13px;color:#B9B2A7}}.ok{{display:none;font-family:var(--serif);font-size:26px;margin-top:22px}}
.chris{{display:flex;gap:20px;align-items:center;flex-wrap:wrap}}.chris img{{width:96px;height:96px;border-radius:999px;object-fit:cover}}
.chris .nm{{font-family:var(--serif);font-size:30px}}footer{{padding:26px 0 40px;font-size:12px;color:#6B655C;border-top:1px solid var(--line)}}.credit{{font-size:12px;color:var(--muted);margin-top:16px}}
.lb{{position:fixed;inset:0;z-index:20;background:rgba(10,12,13,.96);display:none;align-items:center;justify-content:center}}.lb.on{{display:flex}}
.lb img{{max-width:94vw;max-height:84vh;object-fit:contain}}.lb p{{position:absolute;bottom:18px;left:0;right:0;text-align:center;color:#ddd;font-size:14px;margin:0}}
.lb button{{position:absolute;background:rgba(255,255,255,.12);color:#fff;border:0;width:48px;height:48px;border-radius:999px;font-size:22px;cursor:pointer}}
.lb .x{{top:16px;right:16px}}.lb .pv{{left:14px;top:50%}}.lb .nx{{right:14px;top:50%}}
.brand{{min-width:0}}@media(max-width:760px){{.brand{{font-size:15px}}.spec{{grid-template-columns:repeat(2,minmax(0,1fr))}}ul.feats,ul.feats.n4{{grid-template-columns:repeat(2,minmax(0,1fr))}}.grid{{grid-template-columns:repeat(2,minmax(0,1fr))}}.two{{grid-template-columns:1fr}}}}
</style></head><body>
<header class="hero"><img src="photos/{key}/{L['hero']}.webp" alt="{E(addr)}, {E(place)}" fetchpriority="high">
<div class="top"><div class="wrap"><span class="brand">{E(A['team'])}</span><a class="call" href="tel:{A['tel']}">{E(A['phone'])}</a></div></div>
<div class="hc"><div class="wrap"><p class="eb">{E('Coming soon' if soon else L['status'])} · {E(L['city'])}</p><h1>{E(addr)}</h1><p class="place">{E(place)}</p>
<div class="row"><span class="price">{price}</span><span class="facts">{' · '.join(facts)}</span></div>
<div class="ctas"><a class="btn gold" href="#tour">Request a tour</a><a class="btn line" href="#photos">See all {len(order)} photos</a></div></div></div></header>
<main>
<section class="s"><div class="wrap"><p class="eb">{E(L.get('eyebrow', 'The home'))}</p><p class="lede">{E(L['lede'])}</p>
<div class="spec">{spec}</div>{more}
<ul class="feats{" n4" if len(L["features"]) == 4 else ""}">{feats}</ul></div></section>
<section class="s" id="photos"><div class="wrap"><p class="eb">Every photo</p><h2 style="font-size:clamp(30px,4vw,44px);margin-top:10px">Take the tour from here</h2>{gal}{credit}</div></section>
<section class="s dark" id="tour"><div class="wrap"><p class="eb">See it in person</p><h2 style="font-size:clamp(30px,4vw,44px);margin-top:10px">Let's get you inside.</h2>
<div class="tabs" role="tablist"><button type="button" class="tab" role="tab" aria-selected="true" data-t="tour">Request a tour</button><button type="button" class="tab" role="tab" aria-selected="false" data-t="question">Ask a question</button><button type="button" class="tab" role="tab" aria-selected="false" data-t="follow">Follow this home</button></div>
<form id="lf" novalidate>
<div class="two"><label>Name<input name="name" autocomplete="name" required></label><label>Mobile<input name="phone" type="tel" autocomplete="tel" required></label></div>
<label>Email<input name="email" type="email" autocomplete="email" required></label>
<div class="two" data-for="tour"><label>Working with an agent?<select name="agent"><option>No</option><option>Yes</option></select></label><label>How are you buying?<select name="financing"><option>Loan</option><option>Cash</option><option>Not sure yet</option></select></label></div>
<label data-for="tour">Best time to see it<input name="when" placeholder="Saturday afternoon, after 5 on weekdays…"></label>
<label data-for="question" hidden>Your question<textarea name="question" rows="3"></textarea></label>
<input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
<button class="btn gold" id="go" style="justify-self:start">Request a tour</button>
<p class="note" id="er" role="alert"></p>
<p class="note">Your info goes only to {E(A['name'])}. No automated texts, never shared or sold.</p>
</form><p class="ok" id="ok" tabindex="-1"></p></div></section>
<section class="s"><div class="wrap chris"><img src="{A['photo']}" alt="{E(A['name'])}"><div style="flex:1;min-width:240px"><div class="nm">{E(A['name'])}</div><p style="margin:4px 0 0;color:var(--muted)">{E(A['team'])} · {E(A['brokerage'])}</p></div>
<div class="ctas" style="margin:0"><a class="btn dark" href="sms:{A['tel']}">Text me</a><a class="btn line" href="tel:{A['tel']}">{E(A['phone'])}</a></div></div></section>
</main>
<footer><div class="wrap">{E(A['team'])} · {E(A['brokerage'])}. Information deemed reliable but not guaranteed. Each office independently owned and operated.</div></footer>
<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Photo viewer"><img id="lbi" alt=""><p id="lbc"></p><button class="x" type="button" aria-label="Close">×</button><button class="pv" type="button" aria-label="Previous photo">‹</button><button class="nx" type="button" aria-label="Next photo">›</button></div>
<script>
const C={cfg};
const $=s=>document.querySelector(s),src=new URLSearchParams(location.search).get('src')||'direct';
let vid='';try{{vid=localStorage.getItem('ranch.v')||(Math.random().toString(36).slice(2));localStorage.setItem('ranch.v',vid)}}catch(e){{}}
const post=b=>fetch(C.api,{{method:'POST',headers:{{'Content-Type':'text/plain;charset=utf-8'}},body:JSON.stringify(Object.assign({{listing:C.listing,page:C.key,source:src}},b))}}).then(r=>r.json());
post({{type:'visit',view:'home',visitor:vid}}).catch(()=>{{}});
let i=0;const lb=$('#lb'),show=n=>{{i=(n+C.photos.length)%C.photos.length;$('#lbi').src=C.photos[i].src;$('#lbi').alt=C.photos[i].alt;$('#lbc').textContent=C.photos[i].alt+'  ·  '+(i+1)+' / '+C.photos.length}};
document.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{{show(+b.dataset.i);lb.classList.add('on');lb.querySelector('.x').focus()}});
lb.querySelector('.x').onclick=()=>lb.classList.remove('on');lb.querySelector('.pv').onclick=()=>show(i-1);lb.querySelector('.nx').onclick=()=>show(i+1);
document.addEventListener('keydown',e=>{{if(!lb.classList.contains('on'))return;if(e.key==='Escape')lb.classList.remove('on');if(e.key==='ArrowLeft')show(i-1);if(e.key==='ArrowRight')show(i+1)}});
let T='tour';const LABEL={{tour:'Request a tour',question:'Send my question',follow:'Follow this home'}},OK={{tour:"Thank you. I'll reach out personally to set a time.",question:"Thank you. I'll get you an answer personally.",follow:"You're following this home. I'll let you know if anything changes."}};
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{{T=t.dataset.t;document.querySelectorAll('.tab').forEach(x=>x.setAttribute('aria-selected',x===t));document.querySelectorAll('[data-for]').forEach(x=>x.hidden=x.dataset.for!==T);$('#go').textContent=LABEL[T]}});
$('#lf').onsubmit=async e=>{{e.preventDefault();const f=e.target,v=n=>(f.elements[n]?f.elements[n].value.trim():''),b=$('#go');
 if(!v('name')||v('phone').replace(/\\D/g,'').length<10||!/^\\S+@\\S+\\.\\S+$/.test(v('email'))){{$('#er').textContent='Please add your name, a mobile number and an email.';return}}
 if(T==='question'&&!v('question')){{$('#er').textContent='What would you like to know?';return}}
 b.disabled=true;b.textContent='Sending…';$('#er').textContent='';
 try{{const r=await post({{type:T,name:v('name'),phone:v('phone'),email:v('email'),agent:v('agent'),financing:v('financing'),when:v('when'),question:v('question'),website:v('website')}});
  if(!r.ok)throw new Error(r.reason||'');f.style.display='none';$('#ok').textContent=OK[T];$('#ok').style.display='block';$('#ok').focus()}}
 catch(x){{b.disabled=false;b.textContent=LABEL[T];$('#er').textContent=(x.message||"That didn't go through.")+' You can also text {E(A['phone'])}.'}}}};
</script></body></html>'''
    open(os.path.join(R, key + '.html'), 'w').write(page)
    return key + '.html'

if __name__ == '__main__':
    for k in sys.argv[1:]: print('built', build(k))
