"""Social launch kit: 3 post options, each as an Instagram/Facebook 4:5 post plus a 9:16 story.
Writes JPGs to homes/social/ (served at homes.ranchpnw.com/social/)."""
import asyncio, base64
from playwright.async_api import async_playwright
from PIL import Image
F='/home/claude/public-site/fontpkg/node_modules/@fontsource/'
P='/home/claude/app/photos/'
OUT='/home/claude/homes/social/'
def b64(p): return base64.b64encode(open(p,'rb').read()).decode()
fonts=f"""@font-face{{font-family:P;src:url(data:font/woff2;base64,{b64(F+'playfair-display/files/playfair-display-latin-400-normal.woff2')})}}
@font-face{{font-family:P;font-style:italic;src:url(data:font/woff2;base64,{b64(F+'playfair-display/files/playfair-display-latin-400-italic.woff2')})}}
@font-face{{font-family:I;font-weight:400;src:url(data:font/woff2;base64,{b64(F+'inter/files/inter-latin-400-normal.woff2')})}}
@font-face{{font-family:I;font-weight:500;src:url(data:font/woff2;base64,{b64(F+'inter/files/inter-latin-500-normal.woff2')})}}"""
BRAND='<div class=br><b>THE RANCH REAL ESTATE GROUP</b><span>Keller Williams Puget Sound</span></div>'
def card(w,h,img,pos,eb,title,sub,foot='homes.ranchpnw.com/19917',light=False):
    s=w/1080
    return f"""<html><head><style>{fonts}
*{{margin:0;box-sizing:border-box}}body{{width:{w}px;height:{h}px;position:relative;overflow:hidden;font-family:I;background:#16191B}}
.bg{{position:absolute;inset:0;background:url(data:image/jpeg;base64,{b64(P+img)}) {pos}/cover}}
.s{{position:absolute;inset:0;background:linear-gradient(180deg,rgba(22,25,27,.45) 0%,rgba(22,25,27,0) 16%,rgba(22,25,27,0) 46%,rgba(22,25,27,.62) 72%,rgba(22,25,27,.93) 100%)}}
.c{{position:absolute;left:{72*s}px;right:{72*s}px;bottom:{(150 if h>1500 else 76)*s}px;color:#F7F5F1}}
.e{{font-size:{24*s}px;letter-spacing:.22em;text-transform:uppercase;color:#E7D7BF;font-weight:500}}
h1{{font-family:P;font-weight:400;font-size:{(96 if h>1500 else 86)*s}px;line-height:1.02;margin:{18*s}px 0 {18*s}px}}
h1 i{{font-style:italic}}
.sub{{font-size:{30*s}px;color:#E8E3DA;line-height:1.4}}
.ft{{margin-top:{30*s}px;padding-top:{22*s}px;border-top:1px solid rgba(247,245,241,.35);font-size:{24*s}px;letter-spacing:.06em;color:#F7F5F1;display:flex;justify-content:space-between}}
.br{{position:absolute;left:{72*s}px;top:{(110 if h>1500 else 60)*s}px;color:#F7F5F1;font-size:{17*s}px;letter-spacing:.2em;text-shadow:0 1px 8px rgba(0,0,0,.5)}}
.br b{{font-family:P;font-weight:400;font-size:{23*s}px;display:block;letter-spacing:.2em;margin-bottom:{4*s}px}}.br span{{letter-spacing:.06em;font-size:{18*s}px}}
</style></head><body><div class=bg></div><div class=s></div>{BRAND}
<div class=c><div class=e>{eb}</div><h1>{title}</h1><div class=sub>{sub}</div><div class=ft><span>{foot}</span><span>$775,000</span></div></div></body></html>"""
def plain(w,h,img,pos,label):
    return f"""<html><head><style>{fonts}*{{margin:0}}body{{width:{w}px;height:{h}px;position:relative;overflow:hidden;font-family:I;background:#16191B}}
.bg{{position:absolute;inset:0;background:url(data:image/jpeg;base64,{b64(P+img)}) {pos}/cover}}
.l{{position:absolute;left:0;right:0;bottom:0;padding:120px 72px 60px;background:linear-gradient(180deg,rgba(22,25,27,0),rgba(22,25,27,.8));color:#F7F5F1;font-family:P;font-size:44px}}</style></head>
<body><div class=bg></div><div class=l>{label}</div></body></html>"""
POST,STORY=(1080,1350),(1080,1920)
JOBS=[
 # option 1 — Just listed
 ('just-listed-post',POST,card,('front-dusk.jpg','center 55%','Just listed · Tehaleh','19917<br>145th St E','Five bedrooms. Mount Rainier views. Backs to the greenbelt in Bonney Lake’s Tehaleh.')),
 ('just-listed-story',STORY,card,('front-dusk.jpg','center 50%','Just listed · Tehaleh','19917<br>145th St E','Five bedrooms. Mount Rainier views. Backs to the greenbelt.','Tap the link to take the tour')),
 # option 2 — the mountain + the lifestyle
 ('greenbelt-post',POST,card,('greenbelt-yard.jpg','center 50%','Tehaleh · Bonney Lake','Trees out back.<br><i>Trails out front.</i>','A five-bedroom home on Tehaleh’s greenbelt, with 40+ miles of connected trails and Mount Rainier views from upstairs.')),
 ('greenbelt-story',STORY,card,('greenbelt-yard.jpg','center 50%','Tehaleh · Bonney Lake','Trees out back.<br><i>Trails out front.</i>','Backs to the greenbelt, with 40+ miles of trails to explore.','Tap the link to see the home')),
 # option 3 — inside (carousel)
 ('inside-1',POST,card,('kitchen-island.jpg','center 55%','Step inside · 19917 145th St E','Made for<br><i>gathering.</i>','Swipe through the kitchen, great room, primary suite and covered deck.')),
 ('inside-2',POST,plain,('great-room.jpg','center 55%','The great room')),
 ('inside-3',POST,plain,('primary-bed.jpg','center 55%','The primary suite')),
 ('inside-4',POST,plain,('covered-deck.jpg','center 55%','The covered deck, year-round')),
 ('inside-story',STORY,card,('kitchen-island.jpg','center 55%','Step inside · Tehaleh','Made for<br><i>gathering.</i>','Five bedrooms, a chef’s island and a covered deck for every season.','Tap the link for the full tour')),
]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        for name,(w,h),fn,args in JOBS:
            pg=await b.new_page(viewport={'width':w,'height':h})
            await pg.set_content(fn(w,h,*args)); await pg.wait_for_timeout(350)
            await pg.screenshot(path=f'/tmp/{name}.png'); await pg.close()
            Image.open(f'/tmp/{name}.png').convert('RGB').save(OUT+name+'.jpg',quality=88,optimize=True,progressive=True)
        await b.close()
asyncio.run(main())
print('ok')
