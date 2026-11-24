# Ranch listings & guides — source

Everything that builds **homes.ranchpnw.com** (listings) and **gotehaleh.com** (Tehaleh guide), plus the
private Listing Concierge on claude.ai. One source, three outputs.

| Output | Where | Built by |
|---|---|---|
| Listing Concierge (The Desk, seller portal, story) | claude.ai artifact `6a12fcfd-7e65-4e8d-8acd-573532aab862` | `app/build.py <artifact url>` |
| homes.ranchpnw.com/19917 | repo `chrisranch15-gif/homes` (GitHub Pages) | `public-site/build_public.py` + `finish.py` |
| gotehaleh.com | repo `chrisranch15-gif/gotehaleh` (GitHub Pages) | same |
| homes.ranchpnw.com/guides/<town> (town guides; data in `guides/<town>.json`, drafts private until Chris approves) | this repo, `guides/` | `guides/build_guides.py` |
| Lead emails + Sheet | Google Apps Script "Ranch Leads · homes.ranchpnw.com" (Chris's KW Google account) | `apps-script/Code.gs` |

Lead endpoint (web app): `https://script.google.com/macros/s/AKfycbz0ALnuwyuwKaRkr2sGS7N_TPJ3DIXYYRiLP7RiNlBvv5HfQMxfy82jS88ihRab7Duu/exec`

## Rebuild in a fresh session

```bash
# workspace layout the scripts expect
mkdir -p /home/claude/app /home/claude/public-site/fontpkg
cp -r source/app/. /home/claude/app/
cp -r photos thumbs /home/claude/app/          # photos live at the repo root
cp source/public-site/*.py source/public-site/*.html /home/claude/public-site/
cd /home/claude/public-site/fontpkg && npm init -y && npm i terser@5 lighthouse@12 @fontsource/playfair-display @fontsource/inter
# tests (must stay green)
cd /home/claude/app && node -e "const LC=require('./src/engine.js');const T=require('./src/tests.js');const r=T.run(LC);console.log(r.filter(x=>x.pass).length+'/'+r.length)"
# public sites
cd /home/claude/public-site && python3 build_public.py "<lead endpoint>" && python3 finish.py
# then copy sites/homes → repo homes, sites/gotehaleh → repo gotehaleh, sites/live → repo live (live.ranchpnw.com), commit, push main
# (homes/sitemap.xml has a hand-added /sell entry — don't overwrite it)
```

`finish.py` pre-renders each page in headless Chrome (so AI crawlers see full text), adds JSON-LD,
WebP images, minifies, and writes robots.txt / sitemap.xml / llms.txt.

## Rules that keep the pages trustworthy
- Every fact is verified or sourced; unverified facts never publish (square footage stays hidden until confirmed).
- Chris's first-hand experience is written in his voice and signed, never presented as a sourced fact.
- Never show a photo that isn't of the place it sits next to.
- Never put Chris's email in source; his direct line is approved for marketing. The Apps Script sends to whichever account runs it. Full rules: ../CLAUDE.md
- See `GUIDES.md` for the town-guide plan and the daily interview routine.

## The Office: private values
`source/office/index.html` holds `__MY_EMAILS__`. The public copy (`office/index.html`) gets `[]`; only the private claude.ai copy gets Chris's addresses, filled in at publish time. Never commit them.
