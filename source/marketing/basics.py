#!/usr/bin/env python3
"""Business basics: stationery that isn't tied to a listing (Office → Business basics).

    python3 source/marketing/basics.py      → marketing/basics/<look>/*.pdf

Thank-you cards, A2 folded (4.25×5.5 finished; printed flat 8.5×5.5, page 1 outside = back | front, page 2 inside):
  thank-you-meeting   after the first sit-down or walk-through ("thank you for inviting us in")
  thank-you-closing   at closing ("it was an honor")
  thank-you-embossed  the same card with a blind-embossed front (no ink); emboss-die.pdf is the printer's die art
Bespoke and quiet: no house, no listing, just the team's mark on the back. Inside left blank for a handwritten note.
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from pieces import LOOKS, R, AGENT, css, show

OUT = os.path.join(R, 'marketing', 'basics')
LINES = {
    'meeting': ('Thank you for inviting us into your home.',
                'It was a privilege to walk through it with you and to hear what it means to you. We don’t take that trust lightly.'),
    'closing': ('It was an honor.',
                'Thank you for trusting us with your home, and with a chapter that matters so much. We’re grateful, and we’re always here for you.'),
}
SIGN = 'Chris Ranch & The Ranch Real Estate Group'

def front(L, emboss=False):
    dark = not L.get('light') and not emboss   # Estate Editorial: charcoal · Warm Heritage: forest with gold
    bg = L['dark'] if dark else L['paper']
    ink = L['paper'] if dark else L['ink']
    if emboss:   # blind emboss preview: paper-colored letters lifted by light and shadow
        word = f'<p style="margin:0;font-family:{L["head"]};font-style:italic;font-weight:400;font-size:58px;color:{bg};text-shadow:-1px -1px 0 rgba(255,255,255,.9),1px 1px 1px rgba(0,0,0,.28),2px 2px 3px rgba(0,0,0,.08)">Thank you</p>'
        rule = ''
    else:
        word = f'<p style="margin:0;font-family:{L["head"]};font-style:italic;font-weight:400;font-size:56px;color:{L["onDark"] if dark and L["frame"] else ink}">Thank you</p>'
        rule = f'<div style="width:38px;height:1px;background:{L["onDark"] if dark else L["accent"]};margin-top:20px"></div>'
    frame = ''
    if L['frame']: c = L['onDark'] if dark else L['accent']; frame = f'<div style="position:absolute;inset:.22in;border:1px solid {c};outline:1px solid {c};outline-offset:-5px"></div>'
    elif L.get('light') and not emboss: frame = f'<div style="position:absolute;inset:.22in;border:1px solid {L["rule"]}"></div>'
    return f'''<div style="position:relative;width:4.25in;height:5.5in;background:{bg};display:flex;flex-direction:column;align-items:center;justify-content:center">{frame}{word}{rule}</div>'''

def back(L):
    return f'''<div style="position:relative;width:4.25in;height:5.5in;background:{L['paper']};display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:.45in;box-sizing:border-box">
<p style="margin:0;font-family:{L['head']};font-size:13px;letter-spacing:.24em;text-transform:uppercase;color:{L['ink']}">The Ranch</p>
<p style="margin:4px 0 0;font-size:7px;letter-spacing:.3em;text-transform:uppercase;color:{L['muted']}">Real Estate Group</p></div>'''

def inside(L, kind):
    head, body = LINES[kind]
    return f'''<div style="display:flex">
<div style="width:4.25in;height:5.5in;background:{L['paper']}"></div>
<div style="width:4.25in;height:5.5in;background:{L['paper']};padding:.6in .5in .5in;box-sizing:border-box;display:flex;flex-direction:column">
<p style="margin:0;font-family:{L['head']};font-style:italic;font-size:25px;line-height:1.2;color:{L['ink']}">{head}</p>
<p style="margin:14px 0 0;font-size:12.5px;line-height:1.65;color:{L['sub']}">{body}</p>
<div style="flex:1"></div>
<p style="margin:0;font-family:{L['head']};font-size:13px;color:{L['ink']}">{SIGN}</p></div></div>'''

def card(L, kind, emboss=False):
    outside = f'<div class="pg" style="display:flex">{back(L)}{front(L, emboss)}</div>'
    return f"<!doctype html><html lang=en><head><meta charset=utf-8><style>{css(L, 8.5, 5.5)}</style></head><body>{outside}<div class=\"pg\">{inside(L, kind)}</div></body></html>"

DIE = '''<!doctype html><html><head><meta charset=utf-8><style>%s</style></head><body>
<div style="width:8.5in;height:5.5in;display:flex"><div style="width:4.25in"></div><div style="width:4.25in;display:flex;align-items:center;justify-content:center">
<p style="margin:0;font-family:%s;font-style:italic;font-weight:400;font-size:58px;color:#000">Thank you</p></div></div>
<p style="position:absolute;left:.3in;bottom:.2in;margin:0;font:9px Arial;color:#000">Emboss die art: blind emboss (no ink), front panel only. Black = raised.</p></body></html>'''

def build():
    from playwright.sync_api import sync_playwright
    made = []
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page()
        for look, L in LOOKS.items():
            out = os.path.join(OUT, look); os.makedirs(out, exist_ok=True)
            for name, html in [('thank-you-meeting', card(L, 'meeting')), ('thank-you-closing', card(L, 'closing')), ('thank-you-embossed', card(L, 'closing', True))]:
                show(pg, html); f = os.path.join(out, name + '.pdf')
                pg.pdf(path=f, width='8.5in', height='5.5in', print_background=True, prefer_css_page_size=True); made.append(f)
            show(pg, DIE % (css(L, 8.5, 5.5), L['head']))
            f = os.path.join(out, 'emboss-die.pdf'); pg.pdf(path=f, width='8.5in', height='5.5in', prefer_css_page_size=True); made.append(f)
        b.close()
    return made

if __name__ == '__main__':
    print(len(build()), 'files in marketing/basics/')
