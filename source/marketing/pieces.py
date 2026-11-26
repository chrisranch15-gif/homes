#!/usr/bin/env python3
"""Listing launch pieces, in all three looks.

    python3 source/marketing/pieces.py 19917          # every piece, every look
    python3 source/marketing/pieces.py 19917 lookbook  # one piece, every look

Looks (one choice per listing; the Desk toggle switches which one is active):
  editorial  Estate Editorial      dark, cinematic, serif   (pairs with the Noir signs)
  arch       Modern Architectural  white, bold sans         (pairs with the Daylight signs)
  heritage   Warm Heritage         forest, cream, gold      (pairs with the Heritage signs)

Pieces → marketing/<key>/<look>/
  print (Chris picks what to print):  postcard-listed.pdf · postcard-contract.pdf · postcard-sold.pdf ·
                                       preview-invite.pdf · lookbook.pdf · room-cards.pdf · talkers.pdf
  digital (made and ready):            agent-email.html (+ .png preview) · carousel-1..N.png

Facts come from source/marketing/pieces/<key>.json when it exists, else from source/listings/<key>.json.
Nothing here invents a fact: a piece whose facts are missing (a sale price, talkers) is skipped.
"""
import base64, html, io, json, os, sys, datetime
import segno

R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SITE = 'https://homes.ranchpnw.com/'
FONTS = os.path.join(R, 'source', 'print', 'fonts')
AGENT = dict(name='Chris Ranch', phone='(253) 335-5630', sms='+12533355630', team='The Ranch Real Estate Group',
             brokerage='Keller Williams Realty Puget Sound', office='33434 8th Ave S, Suite 103, Federal Way, WA 98003',
             photo='photos/chris-ranch.jpg')
DISCLOSE = (f"{AGENT['brokerage']} · {AGENT['office']} · Each office independently owned and operated · "
            "Equal Housing Opportunity.")
NOSOLICIT = 'If your home is listed with a broker, this is not a solicitation.'

LOOKS = {
    'editorial': dict(name='Estate Editorial', dark='#1C1B19', paper='#F6F2EB', ink='#1C1B19', sub='#3A352F', muted='#6B6257',
                      accent='#8C6A43', onDark='#E8D9C3', onDarkSub='#D8D0C4', rule='#CFC5B7', head="'Cormorant Garamond', serif",
                      hw=500, hs=1, ls='0', frame=False),
    'arch':      dict(name='Modern Architectural', dark='#1A1A1A', paper='#FFFFFF', ink='#1A1A1A', sub='#2A2826', muted='#5F5B55',
                      accent='#8C6A43', onDark='#E8D9C3', onDarkSub='#D8D2C8', rule='#E2DED7', head="Inter, sans-serif",
                      hw=800, hs=.8, ls='-.03em', frame=False),
    'heritage':  dict(name='Warm Heritage', dark='#1F2A24', paper='#F3EBDD', ink='#1F2A24', sub='#3B3A2B', muted='#5F5A48',
                      accent='#8A6A2F', onDark='#D9BC85', onDarkSub='#DDD3C2', rule='#CDBF9F', head="'Cormorant Garamond', serif",
                      hw=600, hs=1, ls='0', frame=True),
}

def esc(s): return html.escape(str(s or ''), quote=True)

def load(key):
    p = os.path.join(R, 'source', 'marketing', 'pieces', key + '.json')
    if os.path.exists(p):
        d = json.load(open(p))
    else:
        s = json.load(open(os.path.join(R, 'source', 'listings', key + '.json')))
        ph = lambda n: next((f'photos/{key}/{n}{x}' for x in ('.jpg', '.webp') if os.path.exists(os.path.join(R, 'photos', key, n + x))), '')
        feats = [dict(title=c, photo=ph(n), story='', note='') for c, n in s.get('features', [])]
        d = dict(key=key, address=s['address'], city=s.get('city', ''), area=s.get('city', ''), price=s.get('price'),
                 beds=s.get('beds'), baths=s.get('baths'), sqft=s.get('sqft'), status=s.get('status', 'Active'),
                 hero=ph(s.get('hero', '')), interior=feats[1]['photo'] if len(feats) > 1 else ph(s.get('hero', '')),
                 tagline='', pitch=s.get('lede', ''), rooms=feats, talkers=s.get('talkers', []), reasons=[],
                 credit=s.get('credit', ''), look=s.get('look', 'editorial'), print=s.get('print', []))
        d['facts_line'] = f"{d['beds']} bedrooms · {d['baths']} baths · {d['sqft']:,} sq ft" if d.get('sqft') else ''
    d.setdefault('area', d.get('city', ''))
    return d

def photo(rel):  # absolute file URL for printing
    return 'file://' + os.path.join(R, rel) if rel else ''

def qr(data, dark='#1C1B19', light='#FFFFFF'):
    b = io.BytesIO(); segno.make(data, error='m').save(b, kind='svg', scale=10, border=2, dark=dark, light=light)
    return 'data:image/svg+xml;base64,' + base64.b64encode(b.getvalue()).decode()

def money(n): return f'${n:,.0f}' if isinstance(n, (int, float)) else str(n or '')

def css(L, w, h):
    f = lambda n, wt, st='normal': f"@font-face{{font-family:'Cormorant Garamond';font-style:{st};font-weight:{wt};src:url('file://{FONTS}/cormorant-garamond-latin-{wt}-{st}.woff2')}}"
    fonts = ''.join(f('x', wt, st) for wt in (400, 500, 600) for st in ('normal', 'italic'))
    return f"""{fonts}
@page{{size:{w}in {h}in;margin:0}}
*{{box-sizing:border-box}}
html,body{{margin:0;padding:0}}
body{{font-family:Inter,sans-serif;color:{L['ink']};-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.pg{{width:{w}in;height:{h}in;position:relative;overflow:hidden;page-break-after:always;break-after:page}}
.pg:last-child{{page-break-after:auto;break-after:auto}}
.h{{font-family:{L['head']};font-weight:{L['hw']};letter-spacing:{L['ls']};margin:0;line-height:1}}
.it{{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:400}}
.eye{{font-size:9pt;letter-spacing:.28em;text-transform:uppercase;margin:0}}
.fine{{font-size:6.5pt;line-height:1.45;color:{L['muted']};margin:0}}
.cover{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}}
.frame{{position:absolute;inset:.17in;border:1px solid rgba(217,188,133,.8);pointer-events:none;z-index:3}}
"""

def doc(L, w, h, pages, extra=''):
    return f"<!doctype html><html lang=en><head><meta charset=utf-8><style>{css(L, w, h)}{extra}</style></head><body>{''.join(pages)}</body></html>"

def hs(L, px): return f'{px * L["hs"]:.0f}px'

def agent_block(L, on_dark=False, size=48):
    c = L['onDark'] if on_dark else L['ink']; s = L['onDarkSub'] if on_dark else L['sub']
    return f"""<div style="display:flex;gap:12px;align-items:center"><img src="{photo(AGENT['photo'])}" style="width:{size}px;height:{size}px;border-radius:50%;object-fit:cover">
<div><p class="h" style="font-size:{hs(L, 19)};color:{c}">{AGENT['name']}</p><p style="margin:3px 0 0;font-size:9.5pt;line-height:1.35;color:{s}">{AGENT['team']}<br>{AGENT['phone']}</p></div></div>"""

def credit(d): return f" Photos: {esc(d['credit'])}." if d.get('credit') else ''

def mail_back(L, d, title, body, qr_url, qr_label, thumbs):
    th = ''.join(f'<img src="{photo(p)}" style="flex:1;min-width:0;height:96px;object-fit:cover">' for p in thumbs if p)
    return f"""<div class="pg" style="background:{L['paper']};padding:.45in .5in;display:grid;grid-template-columns:minmax(0,1fr) 3in;gap:.35in">
<div style="display:flex;flex-direction:column;gap:12px">{title}
<p style="margin:0;font-size:10.5pt;line-height:1.55;color:{L['sub']}">{body}</p>
{f'<div style="display:flex;gap:10px">{th}</div>' if th else ''}
<p class="fine" style="margin-top:auto">{DISCLOSE}{credit(d)} {NOSOLICIT}</p></div>
<div style="display:flex;flex-direction:column;gap:14px">
<div style="height:1.5in;border:1px dashed {L['rule']};display:flex;align-items:center;justify-content:center;font-size:8pt;letter-spacing:.12em;text-transform:uppercase;color:{L['muted']}">Postage · mailing address</div>
<div style="background:{L['dark']};color:{L['onDark']};padding:14px;display:flex;gap:12px;align-items:center">
<img src="{qr(qr_url, L['dark'])}" style="width:1in;height:1in;flex:none;background:#fff">
<p style="margin:0;font-size:10pt;line-height:1.4">{qr_label}</p></div>
<div style="margin-top:auto">{agent_block(L)}</div></div></div>"""

# ---------------- pieces ----------------

def postcard_listed(L, d):
    fr = '<div class="frame"></div>' if L['frame'] else ''
    front = f"""<div class="pg" style="background:{L['dark']}"><img class="cover" src="{photo(d['hero'])}">{fr}
<div style="position:absolute;left:0;right:0;bottom:0;height:3.2in;background:linear-gradient(to top,{L['dark']}e6,{L['dark']}00)"></div>
<p class="h" style="position:absolute;top:.32in;left:.5in;font-size:{hs(L, 17)};color:{L['paper']}">{AGENT['team']}</p>
<div style="position:absolute;left:.5in;right:.5in;bottom:.45in;color:{L['paper']}">
<p class="eye" style="color:{L['onDark']}">Just listed · now’s your chance to pick your neighbor</p>
<h1 class="h" style="font-size:{hs(L, 58)};margin-top:10px">{esc(d['address'])}</h1>
<p style="margin:10px 0 0;font-size:12pt;color:{L['onDark']}">{esc(d['area'])} · {esc(d['facts_line'])}</p></div></div>"""
    title = f"""<p class="eye" style="color:{L['accent']}">Dear neighbor</p>
<h2 class="h" style="font-size:{hs(L, 30)};line-height:1.08;color:{L['ink']}">A home on your street just came to market, and you get to help choose who moves in.</h2>"""
    body = esc(d['pitch']) + ' Know someone who has always wanted to live near you? Send them the link.'
    thumbs = [r.get('photo') for r in d['rooms'][:3]]
    return [front, mail_back(L, d, title, body, SITE + d['key'], 'Every photo, the film and the price.', thumbs)]

def postcard_contract(L, d):
    if not (d.get('listed') and d.get('contract')): return None
    days = (datetime.date.fromisoformat(d['contract']) - datetime.date.fromisoformat(d['listed'])).days
    fr = '<div class="frame"></div>' if L['frame'] else ''
    img = d.get('aerial') or d['hero']
    front = f"""<div class="pg" style="background:{L['dark']}"><img class="cover" src="{photo(img)}">{fr}
<div style="position:absolute;inset:0;background:linear-gradient(to top,{L['dark']}ee,{L['dark']}10 70%)"></div>
<p class="h" style="position:absolute;top:.32in;left:.5in;font-size:{hs(L, 17)};color:{L['paper']}">{AGENT['team']}</p>
<div style="position:absolute;left:.5in;right:.5in;bottom:.45in;color:{L['paper']}">
<p class="eye" style="color:{L['onDark']}">Under contract · {esc(d['address'])}</p>
<h1 class="h" style="font-size:{hs(L, 66)};margin-top:10px">Under contract in {days} day{'s' if days != 1 else ''}.</h1>
<p style="margin:10px 0 0;font-size:13pt;color:{L['onDark']}">Your neighborhood is in demand. Here’s what that means for you →</p></div></div>"""
    fmt = lambda s: datetime.date.fromisoformat(s).strftime('%b %-d')
    title = f"""<p class="eye" style="color:{L['accent']}">Hi neighbor</p>
<h2 class="h" style="font-size:{hs(L, 30)};line-height:1.08;color:{L['ink']}">The home I listed on your street is already under contract.</h2>"""
    body = f"Listed {fmt(d['listed'])}, under contract {fmt(d['contract'])}. If you’ve wondered what your own home would sell for in this market, scan for a free, private estimate. No pressure."
    return [front, mail_back(L, d, title, body, value_url(d), 'What’s my home worth?', [])]

def postcard_sold(L, d):
    if not (d.get('sold_price') and d.get('sold')): return None   # only after closing, with the sellers' OK
    fr = '<div class="frame"></div>' if L['frame'] else ''
    stats = [(money(d['sold_price']), 'sold price')] + ([(d['pct_of_list'], 'of list price')] if d.get('pct_of_list') else [])
    front = f"""<div class="pg" style="background:{L['dark']};display:grid;grid-template-columns:1fr 1fr">
<img src="{photo(d['hero'])}" style="width:100%;height:100%;object-fit:cover">{fr}
<div style="padding:.45in .42in;display:flex;flex-direction:column;color:{L['paper']}">
<p class="h" style="font-size:{hs(L, 16)};color:{L['onDark']}">{AGENT['team']}</p>
<p class="eye" style="margin-top:auto;color:{L['onDark']}">Just sold</p>
<h1 class="h" style="font-size:{hs(L, 44)};margin-top:10px">{esc(d['address'])}</h1>
<div style="margin-top:20px;border-top:1px solid {L['onDark']}55;display:flex;gap:28px;padding-top:14px">{''.join(f'<div><p class="h" style="font-size:{hs(L, 30)}">{esc(v)}</p><p style="margin:4px 0 0;font-size:9pt;color:{L["onDarkSub"]}">{esc(k)}</p></div>' for v, k in stats)}</div></div></div>"""
    title = f"""<p class="eye" style="color:{L['accent']}">Hi neighbor</p>
<h2 class="h" style="font-size:{hs(L, 30)};line-height:1.08;color:{L['ink']}">Thank you for welcoming your new neighbors.</h2>"""
    body = 'This sale is now the newest comparable for homes on your street, which means appraisers and buyers will use it to value yours. Scan to see where your home stands today.'
    return [front, mail_back(L, d, title, body, value_url(d), 'What’s my home worth now?', [])]

def value_url(d): return SITE + 'welcome' + ('' if d['key'] == '19917' else '?home=' + d['key']) + '#value'

def preview_invite(L, d):
    fr = '<div class="frame"></div>' if L['frame'] else ''
    front = f"""<div class="pg" style="background:{L['dark']};color:{L['paper']};padding:.42in;display:flex;flex-direction:column">{fr}
<p class="h" style="font-size:{hs(L, 15)};color:{L['onDark']}">{AGENT['team']}</p>
<img src="{photo(d.get('interior') or d['hero'])}" style="width:100%;height:2.85in;object-fit:cover;margin-top:.28in">
<p class="eye" style="margin-top:.3in;color:{L['onDark']}">You’re invited</p>
<h1 class="h" style="font-size:{hs(L, 40)};line-height:1.02;margin-top:8px">A private preview, for neighbors first</h1>
<p class="it" style="margin:12px 0 0;font-size:18px;color:{L['onDark']}">Before anyone else sees it.</p>
<p style="margin:auto 0 0;font-size:10pt;letter-spacing:.08em">{esc(d['address'])} · {esc(d['area'])}</p></div>"""
    rsvp = f"sms:{AGENT['sms']}?&body=" + f"RSVP for the neighbors’ preview at {d['address']}"
    back = f"""<div class="pg" style="background:{L['paper']};padding:.42in;display:flex;flex-direction:column;gap:14px">
<p class="eye" style="color:{L['accent']}">Neighbors’ preview</p>
<h2 class="h" style="font-size:{hs(L, 28)};line-height:1.1;color:{L['ink']}">Come see it before it goes public, and help choose your next neighbor.</h2>
<div style="border-top:1px solid {L['rule']};border-bottom:1px solid {L['rule']};padding:12px 0;display:grid;grid-template-columns:.8in 1fr;row-gap:6px;font-size:10.5pt;color:{L['ink']}">
<span style="color:{L['muted']}">When</span><span>[DAY, DATE] · [TIME]</span>
<span style="color:{L['muted']}">Where</span><span>{esc(d['address'])}</span>
<span style="color:{L['muted']}">Bring</span><span>Anyone who’s wanted to live near you</span></div>
<p style="margin:0;font-size:10pt;line-height:1.55;color:{L['sub']}">{esc(d['pitch'])}</p>
<div style="margin-top:auto;display:flex;gap:12px;align-items:center;justify-content:space-between">{agent_block(L, size=44)}
<img src="{qr(rsvp, L['ink'])}" style="width:.85in;height:.85in"></div>
<p class="fine">RSVP: scan or text {AGENT['phone']}. {DISCLOSE}{credit(d)} {NOSOLICIT}</p></div>"""
    return [front, back]

def lookbook(L, d):
    fr = '<div class="frame"></div>' if L['frame'] else ''
    cover = f"""<div class="pg" style="background:{L['dark']}"><img class="cover" src="{photo(d['hero'])}">{fr}
<div style="position:absolute;inset:0;background:linear-gradient(to right,{L['dark']}dd 0%,{L['dark']}55 46%,{L['dark']}00 72%)"></div>
<div style="position:absolute;left:.65in;top:.65in;bottom:.65in;width:4.6in;display:flex;flex-direction:column;color:{L['paper']}">
<p class="h" style="font-size:{hs(L, 18)};color:{L['onDark']}">{AGENT['team']}</p>
<p class="eye" style="margin-top:auto;color:{L['onDark']}">{esc(d['area'])} · {esc(d['city'])}</p>
<h1 class="h" style="font-size:{hs(L, 68)};line-height:.98;margin-top:12px">{esc(d['address'])}</h1>
{f'<p class="it" style="margin:14px 0 0;font-size:24px;color:{L["onDark"]}">{esc(d["tagline"])}</p>' if d.get('tagline') else ''}
<p style="margin:22px 0 0;font-size:10.5pt;letter-spacing:.1em;text-transform:uppercase">{esc(d['facts_line'])}</p></div></div>"""
    pages = [cover]
    for i, r in enumerate(d['rooms']):
        if not r.get('photo'): continue
        side = f'<img src="{photo(r["photo2"])}" style="width:100%;height:2.2in;object-fit:cover">' if r.get('photo2') else ''
        pages.append(f"""<div class="pg" style="background:{L['paper']};padding:.5in;display:grid;grid-template-columns:1.55fr 1fr;gap:.38in">
<img src="{photo(r['photo'])}" style="width:100%;height:100%;object-fit:cover">
<div style="display:flex;flex-direction:column;gap:14px">
<p class="eye" style="color:{L['accent']}">{i + 1:02d} · {esc(r['title'])}</p>
<h2 class="h" style="font-size:{hs(L, 40)};line-height:1.02;color:{L['ink']}">{esc(r['title'])}</h2>
{f'<p style="margin:0;font-size:11pt;line-height:1.6;color:{L["sub"]}">{esc(r["story"])}</p>' if r.get('story') else ''}
{side}
<p class="fine" style="margin-top:auto">{esc(d['address'])} · {AGENT['name']} · {AGENT['phone']}</p></div></div>""")
    pages.append(f"""<div class="pg" style="background:{L['dark']};color:{L['paper']};padding:.8in;display:flex;flex-direction:column;align-items:flex-start">{fr}
<p class="eye" style="color:{L['onDark']}">See every room, the film and the floor plans</p>
<h2 class="h" style="font-size:{hs(L, 48)};margin-top:14px;max-width:6.5in;line-height:1.02">{esc(d['address'])}</h2>
<div style="margin-top:.4in;display:flex;gap:.4in;align-items:center"><img src="{qr(SITE + d['key'], L['dark'])}" style="width:1.4in;height:1.4in;background:#fff">
<div>{agent_block(L, True, 56)}</div></div>
<p class="fine" style="margin-top:auto;color:{L['onDarkSub']}">{DISCLOSE}{credit(d)} Information deemed reliable but not guaranteed.</p></div>""")
    return pages

def room_cards(L, d):
    out = []
    for r in d['rooms']:
        if not r.get('photo'): continue
        out.append(f"""<div class="pg" style="background:{L['paper']};display:flex;flex-direction:column">
<img src="{photo(r['photo'])}" style="width:100%;height:2.45in;object-fit:cover">
<div style="padding:.24in .28in .2in;display:flex;flex-direction:column;gap:8px;flex:1">
<p class="eye" style="font-size:7.5pt;color:{L['accent']}">You’re standing in</p>
<h2 class="h" style="font-size:{hs(L, 30)};color:{L['ink']}">{esc(r['title'])}</h2>
{f'<p style="margin:0;font-size:10pt;line-height:1.5;color:{L["sub"]}">{esc(r["story"])}</p>' if r.get('story') else ''}
{f'<p class="it" style="margin:0;font-size:15px;color:{L["accent"]}">{esc(r["note"])}</p>' if r.get('note') else ''}
<div style="margin-top:auto;padding-top:8px;border-top:1px solid {L['rule']};display:flex;align-items:center;gap:10px">
<img src="{qr(SITE + d['key'], L['ink'])}" style="width:.5in;height:.5in"><p style="margin:0;font-size:8pt;line-height:1.35;color:{L['sub']}">Every room, the film and floor plans<br>{AGENT['name']} · {AGENT['phone']}</p></div></div></div>""")
    return out or None

def talkers(L, d):
    out = []
    for t in d.get('talkers') or []:
        txt = f"""<p class="eye" style="font-size:7pt;color:{L['onDark'] if L is not None and False else L['accent']}">{esc(t['eye'])}</p>
<h2 class="h" style="font-size:{hs(L, 26 if t.get('photo') else 30)};line-height:1.02;margin-top:6px;color:{L['ink']}">{esc(t['title'])}</h2>
<p style="margin:8px 0 0;font-size:{'9' if t.get('photo') else '10'}pt;line-height:1.45;color:{L['sub']}">{esc(t['line'])}</p>
<p style="margin:auto 0 0;padding-top:6px;border-top:1px solid {L['rule']};font-size:7pt;color:{L['muted']}">{esc(d['address'])} · {AGENT['name']} · {AGENT['phone']}</p>"""
        fr = f'<div style="position:absolute;inset:.1in;border:1px solid {L["accent"]};pointer-events:none"></div>' if L['frame'] else ''
        if t.get('photo'):
            out.append(f"""<div class="pg" style="background:{L['paper']};display:grid;grid-template-columns:2.05in 1fr">{fr}<img src="{photo(t['photo'])}" style="width:100%;height:100%;object-fit:cover">
<div style="padding:.22in .24in .16in;display:flex;flex-direction:column">{txt}</div></div>""")
        else:
            out.append(f"""<div class="pg" style="background:{L['paper']};padding:.28in .32in .18in;display:flex;flex-direction:column">{fr}{txt}</div>""")
    return out or None

def carousel_slides(L, d):
    fr = '<div class="frame" style="inset:28px"></div>' if L['frame'] else ''
    s = [f"""<div class="pg" style="background:{L['dark']}"><img class="cover" src="{photo(d['hero'])}">{fr}
<div style="position:absolute;inset:0;background:linear-gradient(to top,{L['dark']}e0,{L['dark']}05 60%)"></div>
<div style="position:absolute;left:80px;right:80px;bottom:90px;color:{L['paper']}">
<p class="eye" style="font-size:26px;color:{L['onDark']}">Just listed · {esc(d['area'])}</p>
<h1 class="h" style="font-size:{hs(L, 118)};line-height:1;margin-top:20px">{esc(d.get('tagline') or d['address'])}</h1>
<p style="margin:30px 0 0;font-size:32px;color:{L['onDark']}">Swipe for the rooms that make it →</p></div></div>"""]
    for i, r in enumerate([r for r in d['rooms'] if r.get('photo')][:5]):
        s.append(f"""<div class="pg" style="background:{L['paper']};display:flex;flex-direction:column">
<img src="{photo(r['photo'])}" style="width:1080px;height:830px;object-fit:cover">
<div style="padding:54px 70px">
<p class="eye" style="font-size:24px;color:{L['accent']}">{i + 1:02d} · {esc(r['title'])}</p>
<h2 class="h" style="font-size:{hs(L, 76)};line-height:1.02;margin-top:18px;color:{L['ink']}">{esc(r.get('note') or r['title'])}</h2>
{f'<p style="margin:20px 0 0;font-size:30px;line-height:1.45;color:{L["sub"]}">{esc(r["story"][:140])}{"…" if len(r["story"]) > 140 else ""}</p>' if r.get('story') else ''}</div></div>""")
    s.append(f"""<div class="pg" style="background:{L['dark']};color:{L['paper']};padding:80px;display:flex;flex-direction:column">{fr}
<img src="{photo(d['rooms'][-1]['photo'] if d['rooms'] and d['rooms'][-1].get('photo') else d['hero'])}" style="width:100%;height:620px;object-fit:cover">
<p class="eye" style="font-size:24px;margin-top:50px;color:{L['onDark']}">Last slide</p>
<h2 class="h" style="font-size:{hs(L, 84)};margin-top:16px;line-height:1.02">See every room, and the film</h2>
<p style="margin:26px 0 0;font-size:32px;color:{L['onDark']}">Link in bio · or DM me “{esc(d['key'])}”</p>
<p style="margin:auto 0 0;font-size:22px;color:{L['onDarkSub']}">{AGENT['name']} · {AGENT['team']} · {AGENT['brokerage']} · {AGENT['phone']}</p></div>""")
    return s

def contract_social(L, d):
    """Pending package: under-contract graphics for Instagram/Facebook (post 4:5, story 9:16, square)."""
    if not (d.get('listed') and d.get('contract')): return []
    days = (datetime.date.fromisoformat(d['contract']) - datetime.date.fromisoformat(d['listed'])).days
    dtxt = f'in {days} day' + ('s' if days != 1 else '')
    fr = '<div class="frame" style="inset:30px"></div>' if L['frame'] else ''
    def card(w, h, big, img):
        return (w, h, f"""<div class="pg" style="background:{L['dark']}"><img class="cover" src="{photo(img)}">{fr}
<div style="position:absolute;inset:0;background:linear-gradient(to top,{L['dark']}f0,{L['dark']}20 62%)"></div>
<p class="h" style="position:absolute;top:70px;left:80px;font-size:{hs(L, 34)};color:{L['paper']}">{AGENT['team']}</p>
<div style="position:absolute;left:80px;right:80px;bottom:{int(h * .09)}px;color:{L['paper']}">
<p class="eye" style="font-size:26px;color:{L['onDark']}">Under contract · {esc(d['area'])}</p>
<h1 class="h" style="font-size:{hs(L, big)};line-height:.98;margin-top:22px">Under contract {dtxt}.</h1>
<p style="margin:26px 0 0;font-size:34px;color:{L['onDark']}">{esc(d['address'])}</p>
<p style="margin:18px 0 0;font-size:26px;color:{L['onDarkSub']}">Thinking about selling? Let’s talk. {AGENT['phone']}</p></div></div>""")
    return [('contract-post', *card(1080, 1350, 128, d['hero'])), ('contract-story', *card(1080, 1920, 140, d.get('aerial') or d['hero'])),
            ('contract-square', *card(1080, 1080, 112, d.get('interior') or d['hero']))]

def agent_email(L, d):
    """Email-safe HTML (tables, inline styles, absolute image URLs) Chris pastes into a draft and sends himself."""
    u = lambda rel: SITE + rel
    hf = "Georgia,'Times New Roman',serif" if 'Cormorant' in L['head'] else 'Arial,Helvetica,sans-serif'
    reasons = ''.join(f'<li style="margin:0 0 6px">{esc(a)} {esc(b)}</li>' for a, b in d.get('reasons', [])) or ''.join(
        f'<li style="margin:0 0 6px">{esc(r["title"])}: {esc(r.get("story", ""))}</li>' for r in d['rooms'][:4] if r.get('story'))
    grid = ''.join(f'<td width="50%" style="padding:4px"><img src="{u(r["photo"])}" width="282" style="display:block;width:100%;height:auto"></td>' + ('</tr><tr>' if i % 2 else '')
                   for i, r in enumerate([r for r in d['rooms'] if r.get('photo')][:4]))
    return f"""<!doctype html><html lang=en><head><meta charset=utf-8><title>{esc(d['address'])} · for agents</title></head>
<body style="margin:0;background:#f1efeb"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1efeb"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:{L['ink']}">
<tr><td style="background:{L['dark']};padding:16px 24px;color:{L['onDark']};font-family:{hf};font-size:18px">{AGENT['team']}<span style="float:right;font-family:Arial;font-size:11px;letter-spacing:3px;padding-top:4px">FOR AGENTS</span></td></tr>
<tr><td><img src="{u(d['hero'])}" width="600" style="display:block;width:100%;height:auto" alt="{esc(d['address'])}"></td></tr>
<tr><td style="padding:26px 24px 6px"><p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:{L['accent']}">New to market · {esc(d['area'])}, {esc(d['city'])}</p>
<h1 style="margin:10px 0 0;font-family:{hf};font-weight:normal;font-size:34px;line-height:1.1">{esc(d['address'])}</h1>
<p style="margin:8px 0 0;font-size:22px;font-weight:bold">{money(d.get('price'))}</p>
<p style="margin:8px 0 0;font-size:14px;color:{L['muted']}">{esc(d['facts_line'])}</p>
<h2 style="margin:22px 0 10px;font-family:{hf};font-weight:normal;font-size:22px">Why your buyers will love it</h2>
<ul style="margin:0;padding-left:20px;font-size:15px;line-height:1.55;color:{L['sub']}">{reasons}</ul></td></tr>
<tr><td style="padding:16px 20px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>{grid}</tr></table></td></tr>
<tr><td style="padding:20px 24px 0"><a href="{SITE}{d['key']}" style="display:block;background:{L['dark']};color:#ffffff;text-decoration:none;text-align:center;padding:15px;font-size:15px;font-weight:bold">Photos, film &amp; details</a></td></tr>
{f'<tr><td style="padding:18px 24px 0"><p style="margin:0;padding:14px 16px;background:{L["paper"]};font-size:14px;line-height:1.55;color:{L["sub"]}"><b>Agent notes:</b> {esc(d["agent_notes"])}</p></td></tr>' if d.get('agent_notes') else ''}
<tr><td style="padding:22px 24px"><p style="margin:0;font-size:15px;line-height:1.5"><b>{AGENT['name']}</b> · {AGENT['phone']}<br><span style="color:{L['muted']};font-size:13px">{AGENT['team']} · {AGENT['brokerage']}</span></p></td></tr>
<tr><td style="padding:12px 24px 20px;border-top:1px solid {L['rule']};font-size:11px;line-height:1.5;color:{L['muted']}">{credit(d).strip()} Each office independently owned and operated. Equal Housing Opportunity. Information deemed reliable but not guaranteed.</td></tr>
</table></td></tr></table></body></html>"""

PRINT = [('postcard-listed', 'Just Listed postcard', postcard_listed, 9, 6), ('postcard-contract', 'Under contract postcard', postcard_contract, 9, 6),
         ('postcard-sold', 'Just sold postcard', postcard_sold, 9, 6), ('preview-invite', 'Neighbors’ preview invitation', preview_invite, 5, 7),
         ('lookbook', 'Lookbook', lookbook, 11, 8.5), ('room-cards', 'Room story cards', room_cards, 4, 6), ('talkers', 'Silent talkers', talkers, 5, 3)]
LABEL = {k: t for k, t, *_ in PRINT} | {'agent-email': 'Agent email', 'carousel': 'Instagram carousel'}

TMP = '/tmp/ranch-pieces.html'
def show(pg, html_text):   # load from a file:// page so local photos and fonts are allowed
    open(TMP, 'w').write(html_text); pg.goto('file://' + TMP, wait_until='load')
    pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(100)

def build(key, only=None):
    from playwright.sync_api import sync_playwright
    d = load(key); made = []
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page()
        for look, L in LOOKS.items():
            out = os.path.join(R, 'marketing', key, look); os.makedirs(out, exist_ok=True)
            for k, _, fn, w, h in PRINT:
                if only and only != k: continue
                pages = fn(L, d); f = os.path.join(out, k + '.pdf')
                if not pages:
                    if os.path.exists(f): os.remove(f)
                    continue
                show(pg, doc(L, w, h, pages))
                pg.pdf(path=f, width=f'{w}in', height=f'{h}in', print_background=True, prefer_css_page_size=True); made.append(f)
            if not only or only == 'carousel':
                for old in [x for x in os.listdir(out) if x.startswith('carousel-')]: os.remove(os.path.join(out, old))
                pg.set_viewport_size({'width': 1080, 'height': 1350})
                for i, sl in enumerate(carousel_slides(L, d), 1):
                    show(pg, doc(L, 11.25, 14.0625, [sl], '.pg{width:1080px;height:1350px}'))
                    f = os.path.join(out, f'carousel-{i}.jpg'); pg.screenshot(path=f, type='jpeg', quality=86, clip=dict(x=0, y=0, width=1080, height=1350)); made.append(f)
            if not only or only == 'pending':
                for old in [x for x in os.listdir(out) if x.startswith('contract-') and x.endswith('.jpg')]: os.remove(os.path.join(out, old))
                for name, w, h, sl in contract_social(L, d):
                    pg.set_viewport_size({'width': w, 'height': h})
                    show(pg, doc(L, w / 96, h / 96, [sl], f'.pg{{width:{w}px;height:{h}px}}'))
                    f = os.path.join(out, name + '.jpg'); pg.screenshot(path=f, type='jpeg', quality=86, clip=dict(x=0, y=0, width=w, height=h)); made.append(f)
            if not only or only == 'agent-email':
                f = os.path.join(out, 'agent-email.html'); open(f, 'w').write(agent_email(L, d)); made.append(f)
                pg.set_viewport_size({'width': 640, 'height': 900}); show(pg, agent_email(L, d).replace('src="' + SITE, 'src="file://' + R + '/'))
                pg.screenshot(path=f[:-5] + '.jpg', type='jpeg', quality=80, full_page=True)
        b.close()
    json.dump({'look': d.get('look', 'editorial'), 'print': d.get('print', []), 'address': d['address'], 'status': d.get('status', ''), 'contract': d.get('contract', '')}, open(os.path.join(R, 'marketing', key, 'pieces.json'), 'w'))
    return made

if __name__ == '__main__':
    key = sys.argv[1] if len(sys.argv) > 1 else '19917'
    m = build(key, sys.argv[2] if len(sys.argv) > 2 else None)
    print(f'{key}: {len(m)} files in marketing/{key}/')
