#!/usr/bin/env python3
"""Photo preview: the private page Chris sends his sellers when their photos come back.

    python3 source/public-site/photo_preview.py 13157

Writes preview/<key>-<token>.html (unlisted, noindex, never in the sitemap). The token is kept in the listing's
facts file so the link never changes. No seller names go in the page: the Office adds the greeting to the link
(#for=Stephanie%20and%20Charles), and it is read in the browser only.
"""
import json, os, secrets, sys, html, datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
key = sys.argv[1]
fp = f'{ROOT}/source/listings/{key}.json'
L = json.load(open(fp))
if not L.get('preview_token'):
    L['preview_token'] = secrets.token_hex(5)
    json.dump(L, open(fp, 'w'), indent=1, ensure_ascii=False); open(fp, 'a').write('\n')
idx = json.load(open(f'{ROOT}/photos/{key}/index.json'))
have = {p['slug']: p for p in idx['photos']}
cfg = L.get('preview', {})
e = html.escape
B = f'/photos/{key}/'

def img(slug, cls='', sizes='100vw', alt=''):
    return (f'<img class="{cls}" src="{B}{slug}-800.webp" srcset="{B}{slug}-800.webp 800w, {B}{slug}.webp 1200w" sizes="{sizes}" '
            f'alt="{e(alt)}" loading="lazy" decoding="async" data-full="{B}{slug}.webp">')

# The rooms, in walk-through order: the listing's groups, plus any delivered photo not placed yet (so nothing is missed)
groups = [[t, [s for s in ss if s in have]] for t, ss in (cfg.get('groups') or L.get('groups') or [])]
placed = {s for _, ss in groups for s in ss}
plans = [s for s in have if 'floor' in s]
skip = set(cfg.get('skip', []))
rest = [s for s in have if s not in placed and s not in plans and s not in skip]
if rest: groups.append(['More from the shoot', rest])
total = sum(len(ss) for _, ss in groups) + len(plans)

hero = cfg.get('hero') or L.get('hero')
trio = cfg.get('trio') or [s for _, s in L.get('features', [])][:3]
shot = datetime.date.fromisoformat(L['photo_day']).strftime('%A, %B %-d') if L.get('photo_day') else ''
credit = L.get('credit') or 'Anthony Jones / Rainier Real Estate Photography'
photographer = credit.split('/')[0].strip().split(' ')[0]
note = cfg.get('note') or [
    'This is a preview of your photos. I’m excited to get your home live and on the market.']

sections = ''.join(
    f'<section class="room" id="r{i}"><div class="rh"><h2>{e(t)}</h2><span>{len(ss)} photo{"s" if len(ss) > 1 else ""}</span></div>'
    f'<div class="grid">{"".join(f"<figure class=\"{"w" if j % 5 == 0 else ""}\" data-s=\"{s}\">{img(s, sizes="(min-width:900px) 50vw, 100vw", alt=t)}<button class=\"fav\" aria-label=\"Favorite\" data-s=\"{s}\">♡</button></figure>" for j, s in enumerate(ss))}</div></section>'
    for i, (t, ss) in enumerate(groups))
plan_html = (f'<section class="room plans" id="plans"><div class="rh"><h2>Floor plans</h2><span>Measured on photo day</span></div><div class="pgrid">'
             + ''.join(f'<figure data-s="{s}">{img(s, sizes="(min-width:900px) 33vw, 100vw", alt="Floor plan")}</figure>' for s in sorted(plans, key=lambda s: ('all' in s, s))) + '</div></section>') if plans else ''

page = f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noarchive"><meta name="referrer" content="no-referrer">
<title>Your photos · {e(L["address"])}</title>
<meta property="og:title" content="Your photos are in"><meta property="og:image" content="https://homes.ranchpnw.com{B}{hero}.webp">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{{--night:#16191B;--paper:#F7F5F1;--stone:#ECE7DF;--gold:#C9A877;--brass:#7A5C38;--muted:#5F5950;--line:#DCD4C8;--serif:'Playfair Display',Georgia,serif;--sans:Inter,system-ui,sans-serif}}
*{{box-sizing:border-box}}html{{scroll-behavior:smooth}}body{{margin:0;background:var(--paper);color:var(--night);font:16px/1.65 var(--sans);-webkit-font-smoothing:antialiased}}
img{{display:block;width:100%;height:100%;object-fit:cover}}
.hero{{position:relative;height:100svh;min-height:560px;overflow:hidden;background:var(--night)}}
.hero img{{animation:drift 22s ease-out both}}@keyframes drift{{from{{transform:scale(1.08)}}to{{transform:scale(1)}}}}
.hero::after{{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,17,18,.35) 0,rgba(15,17,18,0) 30%,rgba(15,17,18,.05) 40%,rgba(15,17,18,.82) 100%),linear-gradient(90deg,rgba(15,17,18,.45) 0,rgba(15,17,18,0) 60%)}}
.top{{position:absolute;z-index:2;top:0;left:0;right:0;padding:22px clamp(20px,5vw,56px);display:flex;justify-content:space-between;color:#fff;font-size:11px;letter-spacing:.24em;text-transform:uppercase}}
.cap{{position:absolute;z-index:2;left:0;right:0;bottom:0;padding:0 clamp(20px,5vw,56px) clamp(36px,7vh,72px);color:#fff;max-width:980px}}
.eyebrow{{font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--gold);margin:0 0 14px}}
h1{{font:400 clamp(44px,8vw,96px)/1.02 var(--serif);margin:0;letter-spacing:-.01em}}h1 em{{font-style:italic;color:#f3e6cf}}
.cap .eyebrow{{color:#f3e6cf;text-shadow:0 1px 12px rgba(0,0,0,.5)}}.cap p{{margin:18px 0 0;font-size:15px;opacity:.88}}
.cue{{position:absolute;z-index:2;right:clamp(20px,5vw,56px);bottom:clamp(36px,7vh,72px);color:#fff;font-size:11px;letter-spacing:.24em;text-transform:uppercase;text-decoration:none;opacity:.85}}
.wrap{{max-width:1180px;margin:0 auto;padding:0 clamp(20px,5vw,56px)}}
.letter{{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.35fr);gap:clamp(28px,6vw,90px);padding:clamp(64px,11vw,130px) 0 clamp(48px,8vw,90px);align-items:start}}
.letter h2{{font:400 clamp(30px,4vw,46px)/1.15 var(--serif);margin:0}}.letter h2 em{{color:var(--brass)}}
.letter .body p{{margin:0 0 16px;font-size:17px;color:#2b2925}}.sig{{margin-top:26px;font:italic 400 26px/1 var(--serif);color:var(--night)}}.sig small{{display:block;font:500 11px/1.6 var(--sans);letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin-top:10px;font-style:normal}}
.stats{{display:flex;gap:clamp(22px,5vw,60px);border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:22px 0;margin-bottom:clamp(48px,8vw,90px)}}
.stats div{{font:400 clamp(28px,4vw,40px)/1 var(--serif)}}.stats span{{display:block;font:500 11px/1.4 var(--sans);letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin-top:10px}}
.trio{{display:grid;grid-template-columns:1.4fr 1fr;grid-template-rows:1fr 1fr;gap:10px;height:min(78vw,720px);margin-bottom:clamp(70px,11vw,130px)}}
.trio figure:first-child{{grid-row:1/3}}
figure{{margin:0;position:relative;overflow:hidden;background:var(--stone);cursor:zoom-in}}
figure img{{transition:transform 1.2s cubic-bezier(.2,.7,.2,1)}}figure:hover img{{transform:scale(1.03)}}
.room{{margin-bottom:clamp(60px,10vw,110px)}}
.rh{{display:flex;align-items:baseline;justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:14px;margin-bottom:18px}}
.rh h2{{font:400 clamp(26px,3.4vw,38px)/1.1 var(--serif);margin:0}}.rh span{{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}}
.grid{{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}}.grid figure{{aspect-ratio:4/3}}.grid figure.w{{grid-column:1/-1;aspect-ratio:16/9}}
.pgrid{{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}}.pgrid figure{{aspect-ratio:4/3;background:#fff;border:1px solid var(--line)}}.pgrid img{{object-fit:contain;padding:12px}}
.fav{{position:absolute;top:10px;right:10px;width:42px;height:42px;border-radius:50%;border:0;background:rgba(255,255,255,.88);color:var(--night);font-size:20px;line-height:42px;cursor:pointer;backdrop-filter:blur(6px);transition:transform .2s}}
.fav.on{{background:var(--night);color:#f3d9a8}}.fav:active{{transform:scale(.9)}}
.tray{{position:fixed;z-index:20;left:50%;bottom:18px;transform:translate(-50%,140%);transition:transform .45s cubic-bezier(.2,.8,.2,1);background:var(--night);color:#fff;border-radius:999px;padding:8px 8px 8px 22px;display:flex;gap:14px;align-items:center;box-shadow:0 18px 50px rgba(0,0,0,.3);font-size:14px;white-space:nowrap}}
.tray.show{{transform:translate(-50%,0)}}.tray a{{background:var(--gold);color:var(--night);text-decoration:none;font-weight:600;border-radius:999px;padding:11px 18px}}
.next{{background:var(--night);color:#efe9df;padding:clamp(70px,11vw,130px) 0}}
.next h2{{font:400 clamp(32px,4.4vw,52px)/1.1 var(--serif);margin:0 0 40px;color:#fff}}
.steps{{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(20px,4vw,48px)}}.steps b{{display:block;font:400 34px/1 var(--serif);color:var(--gold);margin-bottom:14px}}.steps p{{margin:0;color:#cfc8bd}}
.contact{{margin-top:8px;display:flex;flex-wrap:wrap;gap:12px}}.contact a{{color:var(--night);background:#f3ede4;text-decoration:none;border-radius:999px;padding:13px 22px;font-weight:600;font-size:15px}}.contact a.ghost{{background:none;color:#fff;border:1px solid rgba(255,255,255,.35)}}
footer{{background:var(--night);color:#8f887d;font-size:12px;padding:0 0 110px}}footer .wrap{{border-top:1px solid rgba(255,255,255,.12);padding-top:24px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px}}
.lb{{position:fixed;inset:0;z-index:30;background:rgba(12,13,14,.96);display:none;align-items:center;justify-content:center}}.lb.on{{display:flex}}
.lb img{{width:auto;height:auto;max-width:94vw;max-height:84vh;object-fit:contain}}
.lb button{{position:absolute;background:none;border:0;color:#fff;font-size:30px;cursor:pointer;padding:16px}}.lb .x{{top:8px;right:8px}}.lb .p{{left:4px;top:50%;transform:translateY(-50%)}}.lb .n{{right:4px;top:50%;transform:translateY(-50%)}}
.lb .c{{position:absolute;bottom:18px;left:0;right:0;text-align:center;color:#bdb5a9;font-size:12px;letter-spacing:.2em;text-transform:uppercase}}
.reveal{{opacity:0;transform:translateY(24px);transition:opacity 1s ease,transform 1s ease}}.reveal.in{{opacity:1;transform:none}}
@media (max-width:760px){{.letter{{grid-template-columns:1fr}}.trio{{grid-template-columns:1fr;grid-template-rows:1.3fr 1fr 1fr;height:150vw}}.trio figure:first-child{{grid-row:auto}}.steps{{grid-template-columns:1fr}}.pgrid{{grid-template-columns:1fr}}.cue{{display:none}}}}
@media (prefers-reduced-motion:reduce){{.hero img{{animation:none}}.reveal{{opacity:1;transform:none}}}}
</style></head><body>
<header class="hero"><img src="{B}{hero}.webp" alt="{e(L["address"])}" fetchpriority="high">
<div class="top"><span>The Ranch Real Estate Group</span><span>Private preview</span></div>
<div class="cap"><p class="eyebrow" id="hi">Your sneak peek</p><h1>{e(L["address"].split(" #")[0])},<br><em>photographed.</em></h1><p>{e(L.get("community") or L["city"])} · {e(L["city"])}, {e(L["state"])}</p></div>
<a class="cue" href="#letter">Scroll ↓</a></header>
<main>
<div class="wrap">
<section class="letter reveal" id="letter"><h2>We have your photos. <em>They look amazing.</em></h2>
<div class="body">{"".join(f"<p>{e(p)}</p>" for p in note)}<div class="sig">Chris<small>Chris Ranch · The Ranch Real Estate Group</small></div></div></section>
<div class="stats reveal"><div>{total}<span>Photos</span></div><div>{len(groups)}<span>Rooms &amp; views</span></div><div>{len(plans) or "—"}<span>Floor plans</span></div></div>
<div class="trio reveal">{"".join(f"<figure data-s=\"{s}\">{img(s, sizes='(min-width:900px) 60vw, 100vw', alt='')}<button class=\"fav\" aria-label=\"Favorite\" data-s=\"{s}\">♡</button></figure>" for s in trio)}</div>
{sections}{plan_html}
</div>
<section class="next"><div class="wrap"><h2>Excited to get your home <em style="color:var(--gold)">live and on the market.</em></h2><div class="contact"><a href="sms:+12533355630">Text me</a><a class="ghost" href="tel:+12533355630">Call (253) 335-5630</a></div></div></section>
</main>
<footer><div class="wrap"><span>Chris Ranch · The Ranch Real Estate Group · Keller Williams Realty Puget Sound</span><span>Photography: {e(credit)}</span></div></footer>
<div class="lb" id="lb" role="dialog" aria-label="Photo"><img alt=""><button class="x" aria-label="Close">×</button><button class="p" aria-label="Previous">‹</button><button class="n" aria-label="Next">›</button><div class="c"></div></div>
<script>
(function(){{
  var K='fav-{key}',favs=[];try{{favs=JSON.parse(localStorage.getItem(K)||'[]')}}catch(e){{}}
  var who=decodeURIComponent((location.hash.match(/for=([^&]+)/)||[])[1]||'').replace(/[<>]/g,'');
  if(who)document.getElementById('hi').textContent=who+', here’s your sneak peek';
  var all=[].slice.call(document.querySelectorAll('figure[data-s]')),order=[],seen={{}};all.forEach(function(f){{if(!seen[f.dataset.s]){{seen[f.dataset.s]=1;order.push(f.dataset.s)}}}});
  function num(s){{return order.indexOf(s)+1}}
  function paint(){{document.querySelectorAll('.fav').forEach(function(b){{var on=favs.indexOf(b.dataset.s)>=0;b.classList.toggle('on',on);b.textContent=on?'♥':'♡'}});
    try{{localStorage.setItem(K,JSON.stringify(favs))}}catch(e){{}}}}
  document.addEventListener('click',function(ev){{var b=ev.target.closest('.fav');if(b){{ev.stopPropagation();var i=favs.indexOf(b.dataset.s);i<0?favs.push(b.dataset.s):favs.splice(i,1);paint();return}}
    var f=ev.target.closest('figure[data-s]');if(f)open(order.indexOf(f.dataset.s))}});
  var lb=document.getElementById('lb'),li=lb.querySelector('img'),cur=0;
  function open(i){{cur=(i+order.length)%order.length;li.src='{B}'+order[cur]+'.webp';lb.querySelector('.c').textContent='Photo '+(cur+1)+' of '+order.length;lb.classList.add('on');document.body.style.overflow='hidden'}}
  function shut(){{lb.classList.remove('on');document.body.style.overflow=''}}
  lb.addEventListener('click',function(ev){{if(ev.target.classList.contains('p'))open(cur-1);else if(ev.target.classList.contains('n'))open(cur+1);else if(ev.target!==li)shut()}});
  document.addEventListener('keydown',function(e){{if(!lb.classList.contains('on'))return;if(e.key==='Escape')shut();if(e.key==='ArrowLeft')open(cur-1);if(e.key==='ArrowRight')open(cur+1)}});
  var x0=null;lb.addEventListener('touchstart',function(e){{x0=e.touches[0].clientX}},{{passive:true}});lb.addEventListener('touchend',function(e){{if(x0===null)return;var d=e.changedTouches[0].clientX-x0;if(Math.abs(d)>50)open(cur+(d<0?1:-1));x0=null}});
  if('IntersectionObserver' in window){{var io=new IntersectionObserver(function(es){{es.forEach(function(en){{if(en.isIntersecting){{en.target.classList.add('in');io.unobserve(en.target)}}}})}},{{threshold:.12}});document.querySelectorAll('.reveal,.room').forEach(function(el){{el.classList.add('reveal');io.observe(el)}})}}
  paint();
}})();
</script></body></html>'''
os.makedirs(f'{ROOT}/preview', exist_ok=True)
out = f'{ROOT}/preview/{key}-{L["preview_token"]}.html'
open(out, 'w').write(page)
print(out.replace(ROOT, 'https://homes.ranchpnw.com'))
