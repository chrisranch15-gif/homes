#!/usr/bin/env python3
"""Social posts for a listing moment (just listed, under contract, sold), ready for Chris to approve.

    python3 source/marketing/social.py 19917 pending      # build one set, in the listing's look
    python3 source/marketing/social.py 19917 pending all  # every look (for the Desk toggle)

The words come from source/marketing/social/<key>-<event>.json, written like a copywriter would
(see source/marketing/social/README.md for the brief). This file is the designer: it lays every
slide out on a fixed grid, in the listing's look, with real photos only.

Out → marketing/<key>/<look>/social-<event>/<post>-<n>.jpg and marketing/<key>/social-<event>.json
(the Office and the Desk read that JSON for the previews and the Approve button).
Nothing here posts. Chris sees each post as it will look and taps Approve; only then is it scheduled.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from pieces import LOOKS, AGENT, R, SITE, esc, photo, doc, show, load

SIZES = {'feed': (1080, 1350), 'story': (1080, 1920), 'gbp': (1200, 900)}
M = 88  # outer margin, px

def team_mark(L, color, size=22):
    return f"""<p style="margin:0;font-family:{L['head']};font-size:{size}px;letter-spacing:.2em;text-transform:uppercase;color:{color};font-weight:{min(L['hw'], 500)}">{AGENT['team']}</p>"""

def eyebrow(L, text, color, rule=True, size=21):
    r = f'<span style="display:inline-block;width:56px;height:1px;background:{color};opacity:.8;margin-right:22px;vertical-align:middle"></span>' if rule else ''
    return f'<p style="margin:0;font-family:Inter,sans-serif;font-weight:500;font-size:{size}px;letter-spacing:.3em;text-transform:uppercase;color:{color}">{r}{esc(text)}</p>'

def head(L, text, size, color, italic=False, lh=1.02):
    fam = L['head']
    st = 'italic' if italic else 'normal'
    # keep the last two words together so a headline never ends on a lone word
    words = esc(text).split(' ')
    t = ' '.join(words[:-2] + ['&nbsp;'.join(words[-2:])]) if len(words) > 3 else esc(text)
    return f'<h1 style="margin:0;font-family:{fam};font-style:{st};font-weight:{L["hw"]};font-size:{size * L["hs"]:.0f}px;line-height:{lh};letter-spacing:{L["ls"]};color:{color};text-wrap:balance">{t}</h1>'

def body(text, size, color, lh=1.45):
    return f'<p style="margin:0;font-family:Inter,sans-serif;font-weight:300;font-size:{size}px;line-height:{lh};color:{color}">{esc(text)}</p>'

def frame(L, inset=34):
    return f'<div style="position:absolute;inset:{inset}px;border:1px solid {L["onDark"]};opacity:.7;pointer-events:none;z-index:3"></div>' if L['frame'] else ''

def slide(L, d, s, fmt):
    w, h = SIZES[fmt]
    lay = s.get('layout', 'cover')
    ph = photo(s.get('photo') or d['hero'])
    light = L.get('light')
    ink, paper, dark = L['ink'], L['paper'], L['dark']
    story = fmt == 'story'
    top_safe, bot_safe = (250, 340) if story else (M, M)

    if lay == 'cover':   # full-bleed photo, one quiet lockup at the foot
        size = s.get('size', 132 if story else (104 if fmt == 'gbp' else 120))
        return f"""<div class="pg" style="background:{dark}"><img class="cover" src="{ph}" style="object-position:{s.get('pos', 'center')}">
<div style="position:absolute;inset:0;background:linear-gradient(to top,{dark}f2 0%,{dark}b0 26%,{dark}00 56%),linear-gradient(to bottom,{dark}99,{dark}00 22%)"></div>{frame(L)}
<div style="position:absolute;top:{top_safe if story else 62}px;left:{M}px;right:{M}px">{team_mark(L, L['onDark'])}</div>
<div style="position:absolute;left:{M}px;right:{M}px;bottom:{bot_safe}px;display:flex;flex-direction:column;gap:28px">
{eyebrow(L, s.get('eyebrow', ''), L['onDark'])}
{head(L, s['head'], size, paper, italic=s.get('italic', False), lh=.98)}
{f'<div style="height:1px;background:{L["onDark"]};opacity:.45;margin:6px 0 2px"></div>' if s.get('line') else ''}
{f'<div style="display:flex;justify-content:space-between;align-items:baseline;gap:30px">{body(s["line"], 28 if not story else 32, L["onDarkSub"], 1.3)}{body(s.get("line2", ""), 24, L["onDarkSub"], 1.3)}</div>' if s.get('line') else ''}
</div></div>"""

    if lay == 'statement':   # paper, a sentence set like a magazine pull quote, small photo strip
        bg, fg, sub, acc = (paper, ink, L['sub'], L['accent']) if s.get('tone') != 'dark' else (dark, paper, L['onDarkSub'], L['onDark'])
        strip = f'<img src="{ph}" style="width:100%;height:{int(h * (.30 if story else .34))}px;object-fit:cover;display:block;object-position:{s.get("pos", "center")}">' if s.get('photo') else ''
        return f"""<div class="pg" style="background:{bg};padding:{top_safe if story else M + 10}px {M}px {bot_safe if story else M}px;display:flex;flex-direction:column">{frame(L) if s.get('tone') == 'dark' else ''}
{eyebrow(L, s.get('eyebrow', ''), acc)}
<div style="margin:auto 0;display:flex;flex-direction:column;gap:34px">
{''.join(f'<div>{head(L, ln, s.get("size", 96 if not story else 108), fg, italic=(i % 2 == 1) and s.get("alt_italic", True), lh=1.02)}</div>' for i, ln in enumerate(s['lines']))}
{body(s['line'], 30, sub) if s.get('line') else ''}
</div>
{strip}
</div>"""

    if lay == 'feature':   # photo on top, the reason it matters underneath
        ph_h = int(h * (.62 if not story else .58))
        n = s.get('num')
        return f"""<div class="pg" style="background:{paper}">
<div style="position:relative;height:{ph_h}px"><img src="{ph}" style="width:100%;height:100%;object-fit:cover;object-position:{s.get('pos', 'center')}">{f'<div style="position:absolute;inset:18px;border:1.5px solid rgba(255,255,255,.8)"></div>' if light else ''}</div>
<div style="position:absolute;left:{M}px;right:{M}px;top:{ph_h + 62}px;bottom:{bot_safe if story else 70}px;display:flex;flex-direction:column;gap:22px">
<div style="display:flex;align-items:baseline;gap:24px">{f'<p style="margin:0;font-family:{L["head"]};font-style:italic;font-size:54px;line-height:1;color:{L["accent"]}">{esc(n)}</p>' if n else ''}{eyebrow(L, s.get('eyebrow', ''), L['accent'], rule=not n)}</div>
{head(L, s['head'], s.get('size', 74 if not story else 84), ink, lh=1.04)}
{body(s['line'], 27 if not story else 32, L['sub']) if s.get('line') else ''}
</div></div>"""

    if lay == 'list':   # what made it: three or four verified reasons, set with rules
        items = ''.join(f"""<div style="display:grid;grid-template-columns:64px 1fr;gap:12px;padding:30px 0;border-top:1px solid {L['rule']}">
<p style="margin:0;font-family:{L['head']};font-style:italic;font-size:44px;line-height:1;color:{L['accent']}">{i + 1:02d}</p>
<div>{head(L, t, 50 if not story else 56, ink, lh=1.06)}{f'<div style="margin-top:12px">{body(x, 25 if not story else 29, L["sub"], 1.4)}</div>' if x else ''}</div></div>""" for i, (t, x) in enumerate(s['items']))
        return f"""<div class="pg" style="background:{paper};padding:{top_safe if story else M + 10}px {M}px {bot_safe if story else M}px;display:flex;flex-direction:column">
{eyebrow(L, s.get('eyebrow', ''), L['accent'])}
<div style="margin-top:34px">{head(L, s['head'], s.get('size', 84 if not story else 92), ink, lh=1.02)}</div>
<div style="margin-top:auto;border-bottom:1px solid {L['rule']}">{items}</div>
</div>"""

    if lay == 'close':   # the agent, the invitation, the fine print
        return f"""<div class="pg" style="background:{dark};padding:{top_safe if story else M + 10}px {M}px {bot_safe if story else 70}px;display:flex;flex-direction:column">{frame(L)}
{team_mark(L, L['onDark'])}
{f'<img src="{ph}" style="width:100%;height:{int(h * .36)}px;object-fit:cover;margin-top:56px;object-position:{s.get("pos", "center")}">' if s.get('photo') else ''}
<div style="margin:auto 0;display:flex;flex-direction:column;gap:34px">
{eyebrow(L, s.get('eyebrow', ''), L['onDark'])}
{head(L, s['head'], s.get('size', 92 if not story else 104), paper, italic=s.get('italic', True), lh=1.02)}
{body(s['line'], 30 if not story else 34, L['onDarkSub']) if s.get('line') else ''}
</div>
<div style="display:flex;align-items:center;gap:26px;padding-top:34px;border-top:1px solid {L['onDark']}55">
<img src="{photo(AGENT['photo'])}" style="width:96px;height:96px;border-radius:50%;object-fit:cover">
<div><p style="margin:0;font-family:{L['head']};font-size:38px;color:{paper}">{AGENT['name']}</p>
<p style="margin:6px 0 0;font-family:Inter,sans-serif;font-size:22px;letter-spacing:.06em;color:{L['onDarkSub']}">{AGENT['phone']} · {AGENT['team']}</p></div></div>
<p style="margin:26px 0 0;font-family:Inter,sans-serif;font-size:15px;line-height:1.5;color:{L['onDarkSub']};opacity:.8">{AGENT['brokerage']} · Each office independently owned and operated · Equal Housing Opportunity.{(' Photos: ' + esc(d['credit']) + '.') if d.get('credit') and s.get('credit', True) else ''}</p>
</div>"""
    raise ValueError('unknown layout ' + lay)

def build(key, event, looks=None):
    from playwright.sync_api import sync_playwright
    d = load(key)
    spec = json.load(open(os.path.join(R, 'source', 'marketing', 'social', f'{key}-{event}.json')))
    looks = looks or [d.get('look', 'editorial')]
    out_posts = []
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page()
        for look in looks:
            L = LOOKS[look]
            od = os.path.join(R, 'marketing', key, look, f'social-{event}'); os.makedirs(od, exist_ok=True)
            for f in os.listdir(od): os.remove(os.path.join(od, f))
            for post in spec['posts']:
                fmt = post['format']; w, h = SIZES[fmt]; imgs = []
                pg.set_viewport_size({'width': w, 'height': h})
                for i, s in enumerate(post['slides'], 1):
                    show(pg, doc(L, w / 96, h / 96, [slide(L, d, s, fmt)], f'.pg{{width:{w}px;height:{h}px}}'))
                    f = os.path.join(od, f"{post['id']}-{i}.jpg")
                    pg.screenshot(path=f, type='jpeg', quality=90, clip=dict(x=0, y=0, width=w, height=h))
                    imgs.append(os.path.relpath(f, R))
                if look == (d.get('look') or 'editorial') or look == looks[0]:
                    out_posts.append(dict({k: v for k, v in post.items() if k != 'slides'}, images=imgs, look=look))
        b.close()
    pub = dict(key=key, address=d['address'], area=d.get('area', ''), event=event, title=spec.get('title', ''), look=looks[0],
               link=spec.get('link', SITE), posts=[dict(p, urls=[SITE + i for i in p['images']]) for p in out_posts if p['look'] == looks[0]])
    json.dump(pub, open(os.path.join(R, 'marketing', key, f'social-{event}.json'), 'w'), indent=1)
    return pub

if __name__ == '__main__':
    key, event = sys.argv[1], sys.argv[2]
    looks = list(LOOKS) if len(sys.argv) > 3 and sys.argv[3] == 'all' else None
    if looks:   # the listing's own look first, so the published set is the one Chris chose
        own = load(key).get('look', 'editorial'); looks = [own] + [l for l in looks if l != own]
    r = build(key, event, looks)
    print(f"{key} {event}: {len(r['posts'])} posts → marketing/{key}/social-{event}.json")
