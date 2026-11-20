import asyncio, base64
from playwright.async_api import async_playwright
F='/home/claude/public-site/fontpkg/node_modules/@fontsource/'
def b64(p): return base64.b64encode(open(p,'rb').read()).decode()
fonts=f"""@font-face{{font-family:P;src:url(data:font/woff2;base64,{b64(F+'playfair-display/files/playfair-display-latin-400-normal.woff2')})}}
@font-face{{font-family:I;font-weight:400;src:url(data:font/woff2;base64,{b64(F+'inter/files/inter-latin-400-normal.woff2')})}}
@font-face{{font-family:I;font-weight:500;src:url(data:font/woff2;base64,{b64(F+'inter/files/inter-latin-500-normal.woff2')})}}"""
CARDS={
 'og-19917':('photos/great-room.jpg','center 60%','Just listed · Tehaleh, Bonney Lake','19917 145th St E','5 bedrooms · Mount Rainier views · backs to the greenbelt'),
 'og-tehaleh':('photos/teh-rainier-boulevard.jpg','center 40%','A guide from someone who lived there','Life in Tehaleh','40+ miles of connected trails · 18 parks · The Retreat, 2027'),
}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1200,'height':630})
        for name,(img,pos,eb,title,sub) in CARDS.items():
            html=f"""<html><head><style>{fonts}
*{{margin:0;box-sizing:border-box}}body{{width:1200px;height:630px;position:relative;overflow:hidden;font-family:I;background:#16191B}}
.bg{{position:absolute;inset:0;background:url(data:image/jpeg;base64,{b64('/home/claude/app/'+img)}) {pos}/cover}}
.s{{position:absolute;inset:0;background:linear-gradient(180deg,rgba(22,25,27,.38) 0%,rgba(22,25,27,0) 22%,rgba(22,25,27,0) 30%,rgba(22,25,27,.55) 62%,rgba(22,25,27,.9) 100%)}}
.c{{position:absolute;left:64px;right:64px;bottom:52px;color:#F7F5F1}}
.e{{font-size:20px;letter-spacing:.22em;text-transform:uppercase;color:#E7D7BF;font-weight:500}}
h1{{font-family:P;font-weight:400;font-size:76px;line-height:1.02;margin:14px 0 14px}}
.sub{{font-size:24px;color:#E8E3DA}}
.br{{position:absolute;right:64px;top:44px;text-align:right;color:#F7F5F1;font-size:15px;letter-spacing:.24em;text-shadow:0 1px 8px rgba(0,0,0,.5)}}
.br b{{font-family:P;font-weight:400;font-size:19px;display:block;letter-spacing:.2em}}.br span{{letter-spacing:.04em;font-size:16px}}
</style></head><body><div class=bg></div><div class=s></div>
<div class=br><b>THE RANCH REAL ESTATE GROUP</b><span>Keller Williams Puget Sound</span></div>
<div class=c><div class=e>{eb}</div><h1>{title}</h1><div class=sub>{sub}</div></div></body></html>"""
            await pg.set_content(html); await pg.wait_for_timeout(400)
            await pg.screenshot(path=f'/home/claude/public-site/{name}.png')
            from PIL import Image
            Image.open(f'/home/claude/public-site/{name}.png').convert('RGB').save(f'/home/claude/app/photos/{name}.jpg',quality=86,optimize=True,progressive=True)
        await b.close()
asyncio.run(main())
