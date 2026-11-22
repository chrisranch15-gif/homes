"""Open house sign templates — The Ranch Real Estate Group.

    python3 open_house_signs.py 19917 noir        → print/open-house-signs-19917-noir.pdf
    python3 open_house_signs.py 19917 all         → all three styles + a preview sheet

Every listing gets the same set of signs, each with its own QR code (scan-tested on build):
    1. Please sign in              → homes.ranchpnw.com/welcome?home=<key>
    2. Off-market buyer program (gold)   → …#offmarket   (always the standout sign)
    3. The market has changed      → …#value
    4. Table tent (two per page, fold in half): sign in + private list

Styles: noir (dark, cinematic) · daylight (light, airy) · gallery (full-bleed photo, glass QR card)
Add a listing by adding an entry to LISTINGS. Photos must be of this home (CLAUDE.md rule 9).
"""
import sys, os, segno
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from reportlab.lib.colors import HexColor, Color

HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
F = '/usr/share/fonts/truetype/google-fonts/'
for n, f in [('Serif', 'Lora-Variable.ttf'), ('Sans', 'Poppins-Regular.ttf'), ('SansM', 'Poppins-Medium.ttf'), ('SansL', 'Poppins-Light.ttf')]:
    pdfmetrics.registerFont(TTFont(n, F + f))

AGENT = dict(name='Chris Ranch', phone='(253) 335-5630', team='The Ranch Real Estate Group',
             brokerage='Keller Williams Realty Puget Sound', extra='KW Luxury')
LISTINGS = {
    '19917': dict(address='19917 145th St E', area='Tehaleh · Bonney Lake',
                  signin='photos/great-room.jpg', value='photos/front-dusk.jpg', offmarket='photos/mtn-alpenglow.jpg'),
}
NIGHT, GOLD, CREAM, INK = HexColor('#16191B'), HexColor('#C9A877'), HexColor('#F7F5F1'), HexColor('#1E2327')
MUTED, BRONZE, WHITE, DIM = HexColor('#5E584E'), HexColor('#8C6A43'), HexColor('#FFFFFF'), HexColor('#A9A39A')
W, H = letter

def signs(key, L):
    base = f'https://homes.ranchpnw.com/welcome' + ('' if key == '19917' else f'?home={key}')
    return [
        dict(id='signin', url=base, eyebrow='PLEASE SIGN IN', title='Welcome in.',
             sub='The sellers ask that every guest\nsign in before touring.', foot='Scan with your phone camera · about 20 seconds', photo=L['signin']),
        dict(id='offmarket', url=base + '#offmarket', eyebrow='OFF-MARKET BUYER PROGRAM', title='Not quite the one?', gold=True,
             sub='We don’t wait for the right home to come online.\nWe go hunting for it.', foot='Scan to book your consult · for buyers not yet working with an agent', photo=L['offmarket']),
        dict(id='value', url=base + '#value', eyebrow='HOME VALUE REPORT', title='The market has changed.',
             sub='Has your home’s value? Get an updated\nreport, prepared personally.', foot='Scan for your free value report', photo=L['value']),
    ]

def qr(url, path, dark='#16191B', light='#FFFFFF'):
    segno.make(url, error='q').save(path, scale=24, border=2, dark=dark, light=light)
    try:
        import zxingcpp; from PIL import Image
        assert [r.text for r in zxingcpp.read_barcodes(Image.open(path))] == [url], 'QR does not scan: ' + url
    except ImportError: pass
    return path

def photo(c, path, x, y, w, h):
    img = ImageReader(os.path.join(REPO, path)); iw, ih = img.getSize(); sc = max(w / iw, h / ih)
    c.saveState(); p = c.beginPath(); p.rect(x, y, w, h); c.clipPath(p, stroke=0)
    c.drawImage(img, x + (w - iw * sc) / 2, y + (h - ih * sc) / 2, iw * sc, ih * sc); c.restoreState()

def fade(c, y0, h, color, up=True, steps=70, power=1.6):
    c.saveState()
    for i in range(steps):
        a = (i / (steps - 1)) ** power; c.setFillColor(color); c.setFillAlpha(a)
        yy = y0 + (h - (i + 1) * h / steps if up else i * h / steps)
        c.rect(0, yy, W, h / steps + 1, fill=1, stroke=0)
    c.restoreState()

def lines(c, text, y, font, size, color, lead):
    c.setFont(font, size); c.setFillColor(color)
    for i, l in enumerate(text.split('\n')): c.drawCentredString(W / 2, y - i * lead, l)

def spaced(s): return '  '.join(s)

def footer(c, light):
    c.setFillColor(INK if light else WHITE); c.setFont('SansM', 10)
    c.drawCentredString(W / 2, 0.66 * 72, f"{AGENT['name']}  ·  Call or text {AGENT['phone']}")
    c.setFillColor(MUTED if light else DIM); c.setFont('Sans', 8)
    c.drawCentredString(W / 2, 0.46 * 72, f"{AGENT['team']}  ·  {AGENT['brokerage']}  ·  {AGENT['extra']}")

def qr_block(c, path, s, qy, bracket):
    pad = 12; x = (W - s) / 2
    c.setFillColor(WHITE); c.roundRect(x - pad, qy - pad, s + 2 * pad, s + 2 * pad, 14, fill=1, stroke=0)
    c.drawImage(path, x, qy, s, s)
    if bracket:
        c.setStrokeColor(bracket); c.setLineWidth(1.2)
        for dx, dy in [(-1, -1), (1, -1), (-1, 1), (1, 1)]:
            cx = W / 2 + dx * (s / 2 + pad + 10); cy = qy + s / 2 + dy * (s / 2 + pad + 10)
            c.line(cx, cy, cx - dx * 18, cy); c.line(cx, cy, cx, cy - dy * 18)

def badge(c, text, y, bg, fg):
    c.setFont('SansM', 8.5); w = c.stringWidth(spaced(text), 'SansM', 8.5) + 26
    c.setFillColor(bg); c.roundRect((W - w) / 2, y - 7, w, 22, 11, fill=1, stroke=0)
    c.setFillColor(fg); c.drawCentredString(W / 2, y, spaced(text))

def noir(c, S, L, q):
    gold = S.get('gold'); bg = GOLD if gold else NIGHT
    c.setFillColor(bg); c.rect(0, 0, W, H, fill=1, stroke=0)
    ph = 4.3 * 72; photo(c, S['photo'], 0, H - ph, W, ph); fade(c, H - ph - 1, ph * .55, bg)
    c.setFillColor(WHITE); c.setFont('SansM', 8.5); c.drawString(.6 * 72, H - .55 * 72, AGENT['team'].upper())
    y = H - ph + .15 * 72
    if gold: badge(c, 'OFF-MARKET BUYER PROGRAM', y + 4, NIGHT, GOLD)
    else: c.setFillColor(GOLD); c.setFont('SansM', 10); c.drawCentredString(W / 2, y, spaced(S['eyebrow']))
    c.setFillColor(NIGHT if gold else WHITE); c.setFont('Serif', 40); c.drawCentredString(W / 2, y - 50, S['title'])
    lines(c, S['sub'], y - 80, 'SansL' if not gold else 'Sans', 13.5, HexColor('#3A3125') if gold else DIM, 19)
    qr_block(c, q, 2.7 * 72, 1.55 * 72, NIGHT if gold else GOLD)
    c.setFillColor(NIGHT if gold else GOLD); c.setFont('SansM' if gold else 'Sans', 11); c.drawCentredString(W / 2, 1.05 * 72, S['foot'])
    if gold:
        c.setFillColor(NIGHT); c.setFont('SansM', 10); c.drawCentredString(W / 2, .66 * 72, f"{AGENT['name']}  ·  Call or text {AGENT['phone']}")
        c.setFillColor(HexColor('#4A3E2C')); c.setFont('Sans', 8); c.drawCentredString(W / 2, .46 * 72, f"{AGENT['team']}  ·  {AGENT['brokerage']}  ·  {AGENT['extra']}")
    else: footer(c, False)

def daylight(c, S, L, q):
    gold = S.get('gold')
    c.setFillColor(CREAM); c.rect(0, 0, W, H, fill=1, stroke=0)
    m = .45 * 72; ph = 4.0 * 72
    photo(c, S['photo'], m, H - m - ph, W - 2 * m, ph)
    c.setStrokeColor(WHITE); c.setLineWidth(1); c.rect(m + 10, H - m - ph + 10, W - 2 * m - 20, ph - 20, stroke=1, fill=0)
    y = H - m - ph - .5 * 72
    if gold:
        c.setFillColor(GOLD); c.rect(0, 0, W, y + .32 * 72, fill=1, stroke=0)
        badge(c, 'OFF-MARKET BUYER PROGRAM', y - 2, NIGHT, GOLD)
    else: c.setFillColor(BRONZE); c.setFont('SansM', 10); c.drawCentredString(W / 2, y, spaced(S['eyebrow']))
    c.setFillColor(INK); c.setFont('Serif', 38); c.drawCentredString(W / 2, y - 48, S['title'])
    lines(c, S['sub'], y - 76, 'Sans', 13, HexColor('#3A3125') if gold else MUTED, 18)
    qr_block(c, q, 2.45 * 72, 1.5 * 72, NIGHT if gold else BRONZE)
    c.setFillColor(NIGHT if gold else BRONZE); c.setFont('SansM', 10.5); c.drawCentredString(W / 2, 1.05 * 72, S['foot'])
    footer(c, True)

def gallery(c, S, L, q):
    gold = S.get('gold')
    photo(c, S['photo'], 0, 0, W, H)
    c.saveState(); c.setFillColor(NIGHT); c.setFillAlpha(.28); c.rect(0, 0, W, H, fill=1, stroke=0); c.restoreState()
    fade(c, 0, H * .42, NIGHT, up=True, power=1.2)  # darker toward the bottom for the footer
    cw, ch = 5.6 * 72, 6.9 * 72; cx, cy = (W - cw) / 2, 1.25 * 72
    c.saveState(); c.setFillColor(GOLD if gold else Color(.09, .1, .11)); c.setFillAlpha(.97 if gold else .82)
    c.roundRect(cx, cy, cw, ch, 22, fill=1, stroke=0); c.restoreState()
    top = cy + ch - .55 * 72
    if gold: badge(c, 'OFF-MARKET BUYER PROGRAM', top, NIGHT, GOLD)
    else: c.setFillColor(GOLD); c.setFont('SansM', 10); c.drawCentredString(W / 2, top, spaced(S['eyebrow']))
    c.setFillColor(NIGHT if gold else WHITE); c.setFont('Serif', 34); c.drawCentredString(W / 2, top - 46, S['title'])
    lines(c, S['sub'], top - 72, 'Sans', 12, HexColor('#3A3125') if gold else HexColor('#D8D2C8'), 17)
    qr_block(c, q, 2.5 * 72, cy + .95 * 72, None)
    c.setFillColor(NIGHT if gold else GOLD); c.setFont('SansM', 10); c.drawCentredString(W / 2, cy + .42 * 72, S['foot'])
    c.setFillColor(WHITE); c.setFont('SansM', 9); c.drawString(.6 * 72, H - .6 * 72, AGENT['team'].upper())
    c.drawRightString(W - .6 * 72, H - .6 * 72, L['address'].upper())
    footer(c, False)

def tent(c, L, key, style, qs):
    """Two table tents per page: cut on the middle line, fold each in half. Sign in + private list."""
    c.setFillColor(CREAM if style == 'daylight' else NIGHT); c.rect(0, 0, W, H, fill=1, stroke=0)
    light = style == 'daylight'
    for i, (sid, title, sub, gold) in enumerate([('signin', 'Please sign in', 'The sellers ask every guest to sign in.', False),
                                                  ('offmarket', 'Not quite the one?', 'We don’t wait. We go hunting. Book your consult.', True)]):
        y0 = H / 2 if i == 0 else 0; panel = H / 2
        if gold: c.setFillColor(GOLD); c.rect(0, y0, W, panel, fill=1, stroke=0)
        fg = NIGHT if (gold or light) else WHITE
        # front half (upper part of each tent, printed upside down so it reads after folding)
        for half, flip in [(0, False), (1, True)]:
            c.saveState(); hy = y0 + half * panel / 2
            if flip: c.translate(W / 2, hy + panel / 4); c.rotate(180); c.translate(-W / 2, -(hy + panel / 4))
            s = 1.55 * 72; x = 1.0 * 72; qy = hy + (panel / 2 - s) / 2
            c.setFillColor(WHITE); c.roundRect(x - 8, qy - 8, s + 16, s + 16, 10, fill=1, stroke=0); c.drawImage(qs[sid], x, qy, s, s)
            c.setFillColor(GOLD if not (gold or light) else (NIGHT if gold else BRONZE)); c.setFont('SansM', 8)
            c.drawString(x + s + .45 * 72, qy + s - 14, spaced('OFF-MARKET BUYER PROGRAM' if gold else 'WELCOME'))
            c.setFillColor(fg); c.setFont('Serif', 28); c.drawString(x + s + .45 * 72, qy + s / 2 + 4, title)
            c.setFont('Sans', 11.5); c.drawString(x + s + .45 * 72, qy + s / 2 - 20, sub)
            c.setFont('Sans', 8.5); c.drawString(x + s + .45 * 72, qy + 6, f"{AGENT['name']} · {AGENT['phone']} · {AGENT['team']}")
            c.restoreState()
        c.setDash(2, 4); c.setStrokeColor(DIM); c.setLineWidth(.5); c.line(.3 * 72, y0 + panel / 2, W - .3 * 72, y0 + panel / 2); c.setDash()
    c.setStrokeColor(DIM); c.line(0, H / 2, W, H / 2)

STYLES = dict(noir=noir, daylight=daylight, gallery=gallery)

def build(key, style, out_dir):
    L = LISTINGS[key]; os.makedirs(out_dir, exist_ok=True); tmp = os.path.join(out_dir, '.qr'); os.makedirs(tmp, exist_ok=True)
    out = os.path.join(out_dir, f'open-house-signs-{key}-{style}.pdf'); c = canvas.Canvas(out, pagesize=letter)
    c.setTitle(f"Open house signs · {L['address']} · {style}"); c.setAuthor(AGENT['team'])
    qs = {}
    for S in signs(key, L):
        qs[S['id']] = qr(S['url'], os.path.join(tmp, f"{key}-{S['id']}.png"))
        STYLES[style](c, S, L, qs[S['id']]); c.showPage()
    tent(c, L, key, style, qs); c.showPage(); c.save(); return out

if __name__ == '__main__':
    key = sys.argv[1] if len(sys.argv) > 1 else '19917'; style = sys.argv[2] if len(sys.argv) > 2 else 'noir'
    out_dir = sys.argv[3] if len(sys.argv) > 3 else os.path.join(REPO, 'print')
    for s in (STYLES if style == 'all' else [style]): print(build(key, s, out_dir))
