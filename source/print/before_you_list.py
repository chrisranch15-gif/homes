"""Branded "Before you list" handout, in the listing-presentation style.
Reads source/content/prep.json (same list as the seller portal and launch plans).
Writes print/before-you-list.html (self-contained) and print/before-you-list.pdf (Letter).
Agent details come from AGENT so other agents can reuse it."""
import base64, html, json, os, subprocess, sys
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
AGENT = {'name': 'Chris Ranch', 'team': 'The Ranch Real Estate Group', 'phone': '(253) 335-5630',
         'brokerage': 'Keller Williams Realty Puget Sound', 'site': 'homes.ranchpnw.com'}
PREP = json.load(open(os.path.join(R, 'source/content/prep.json')))
E = html.escape
F = os.path.join(R, 'source/print/fonts')
def font(fam, file, w=400, st='normal'):
    b = base64.b64encode(open(os.path.join(F, file), 'rb').read()).decode()
    return f"@font-face{{font-family:'{fam}';font-weight:{w};font-style:{st};src:url(data:font/woff2;base64,{b}) format('woff2')}}"
FONTS = ''.join([font('Playfair Display', 'playfair-display-latin-400-normal.woff2'),
                 font('Playfair Display', 'playfair-display-latin-400-italic.woff2', st='italic'),
                 font('Inter', 'inter-latin-400-normal.woff2'), font('Inter', 'inter-latin-500-normal.woff2', 500),
                 font('Inter', 'inter-latin-600-normal.woff2', 600)])
CSS = FONTS + '''
:root{--night:#16191B;--ink:#1E2327;--paper:#F7F5F1;--stone:#ECE7DF;--sand:#E7D7BF;--brass:#8C6A43;--muted:#5F5950;--line:#DCD4C8;--serif:'Playfair Display',Georgia,serif}
*{box-sizing:border-box}html,body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:980px;margin:0 auto;padding:0 clamp(22px,5vw,56px)}
.eyebrow{margin:0;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:var(--brass);font-weight:500}
h1,h2{font-family:var(--serif);font-weight:400;letter-spacing:-.01em;margin:0}
.hero{background:var(--night);color:var(--paper);padding:30px 0 64px}
.top{display:flex;justify-content:space-between;align-items:baseline;gap:16px;font-family:var(--serif);font-size:17px}
.top span:last-child{font-family:Inter;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--sand)}
.hero .eyebrow{color:var(--sand);margin-top:72px}.hero h1{font-size:clamp(48px,8vw,88px);line-height:1;margin-top:14px}
.hero h1 em{color:var(--sand)}.hero p{color:#CFC9C0;font-size:19px;max-width:600px;margin:20px 0 0}
section{padding:52px 0;border-top:1px solid var(--line)}section.stone{background:var(--stone)}
section.dark{background:var(--night);color:var(--paper);border:0}section.dark .eyebrow{color:var(--sand)}
.hd{display:flex;gap:22px;align-items:baseline}.n{font-family:var(--serif);font-size:40px;line-height:1;color:var(--brass)}
section.dark .n{color:var(--sand)}h2{font-size:clamp(28px,4vw,40px);line-height:1.1}
.lede{color:var(--muted);font-size:17px;max-width:640px;margin:12px 0 0}section.dark .lede{color:#CFC9C0}
ul.chk{list-style:none;padding:0;margin:26px 0 0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 40px}
ul.chk li{border-top:1px solid var(--line);padding:12px 0}section.dark ul.chk li{border-color:#33393D}
label{display:flex;gap:14px;align-items:flex-start;cursor:pointer}
input{appearance:none;flex:none;width:18px;height:18px;margin:3px 0 0;border:1.5px solid var(--brass);border-radius:2px;background:transparent;display:grid;place-items:center}
section.dark input{border-color:var(--sand)}
input:checked{background:var(--brass)}input:checked:after{content:"";width:5px;height:9px;border:solid var(--paper);border-width:0 2px 2px 0;transform:rotate(45deg) translate(-1px,-1px)}
input:checked+span{color:var(--muted);text-decoration:line-through;text-decoration-color:var(--line)}
.note{margin:22px 0 0;padding:16px 20px;border-left:2px solid var(--brass);background:#fff;font-size:15px;color:var(--muted);font-style:italic;max-width:720px}
.chris{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;padding:44px 0}
.chris .nm{font-family:var(--serif);font-size:30px;line-height:1.1}.chris p{margin:6px 0 0;color:var(--muted);font-size:15px}
.chris a{color:var(--ink);font-weight:500;text-decoration:none;border-bottom:1px solid var(--brass)}
.foot{padding:16px 0 40px;font-size:12px;color:#6B655C;border-top:1px solid var(--line)}
@media(max-width:700px){ul.chk{grid-template-columns:1fr}}
@page{size:letter;margin:0}
@media print{html,body{background:var(--paper)}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}
 .hero{padding:22px 0 30px}.hero .eyebrow{margin-top:26px}.hero h1{font-size:54px}.hero p{font-size:15px;margin-top:12px}
 section{padding:20px 0;break-inside:avoid}section.p2{break-before:page}ul.chk{margin-top:12px;gap:0 32px}ul.chk li{padding:6px 0}
 body{font-size:12.5px;line-height:1.45}.lede{font-size:13.5px;margin-top:6px}h2{font-size:25px}.n{font-size:28px}
 .note{margin-top:12px;padding:10px 14px;font-size:12.5px}input{width:14px;height:14px;margin-top:2px}
 .chris{padding:18px 0}.chris .nm{font-size:24px}.foot{padding:10px 0 0}}
'''
def items(g):
    return ''.join(f'<li><label><input type="checkbox" data-k="{g["id"]}-{i}"><span>{E(t)}</span></label></li>'
                   for i, t in enumerate(g['items']))
def section(n, g, cls=''):
    lede = f'<p class="lede">{E(g["lede"])}</p>' if g.get('lede') else ''
    note = f'<p class="note">{E(g["note"])}</p>' if g.get('note') else ''
    return (f'<section class="{cls}"><div class="wrap"><div class="hd"><span class="n">{n:02d}</span><div>'
            f'<p class="eyebrow">{"Before closing day" if g["when"] == "closing" else "Before we list"}</p>'
            f'<h2>{E(g["name"])}</h2></div></div>{lede}<ul class="chk">{items(g)}</ul>{note}</div></section>')
def build():
    A = AGENT
    secs, n = '', 0
    for g in PREP['groups']:
        n += 1
        cls = 'dark' if g['id'] == 'small' else ('stone' if g['when'] == 'closing' else '')
        if g['id'] == 'outside': cls += ' p2'
        secs += section(n, g, cls)
    tel = ''.join(c for c in A['phone'] if c.isdigit())
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Before You List · {E(A['team'])}</title><style>{CSS}</style></head><body>
<header class="hero"><div class="wrap"><div class="top"><span>{E(A['team'])}</span><span>Seller prep checklist</span></div>
<p class="eyebrow">Before we list</p><h1>Before you <em>list.</em></h1>
<p>{E(PREP['lede'])} Tick them off as you go, and call me with any questions.</p></div></header>
{secs}
<div class="wrap"><div class="chris"><div><div class="nm">{E(A['name'])}</div><p>{E(A['team'])}</p></div>
<div style="text-align:right"><p><a href="tel:{tel}">{E(A['phone'])}</a></p><p>{E(A['site'])}</p></div></div>
<div class="foot">{E(A['team'])} · {E(A['brokerage'])}. Each office independently owned and operated.</div></div>
<script>(function(){{var K='ranch.prep.handout',d={{}};try{{d=JSON.parse(localStorage.getItem(K)||'{{}}')}}catch(e){{}}
document.querySelectorAll('input[data-k]').forEach(function(b){{b.checked=!!d[b.dataset.k];b.onchange=function(){{d[b.dataset.k]=b.checked;try{{localStorage.setItem(K,JSON.stringify(d))}}catch(e){{}}}}}})}})();</script>
</body></html>'''
if __name__ == '__main__':
    out = os.path.join(R, 'print'); os.makedirs(out, exist_ok=True)
    h = os.path.join(out, 'before-you-list.html'); open(h, 'w').write(build())
    subprocess.run(['/usr/bin/google-chrome', '--headless=new', '--no-sandbox', '--no-pdf-header-footer',
                    f'--print-to-pdf={os.path.join(out, "before-you-list.pdf")}', 'file://' + h],
                   check=True, capture_output=True)
    print('wrote', h)
