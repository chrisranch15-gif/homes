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

## Marketing assets and the Sites gallery
`source/marketing/build_assets.py` (run by `source/office/ship.sh`) finds every listing's launch assets by file name
(`<key>.html`, `print/<key>-*brochure.pdf`, `print/open-house-signs-<key>-<style>.pdf`, `social/video/<key>-*.mp4`,
`social/<key>/*.jpg`), makes thumbnails in `marketing/thumbs/`, and writes the Desk's `src/assets.js` and the Office's
`source/office/sites.json` (public sites + town guides from `source/guides/*.json`). Name launch files this way and they
show up on the Desk's Marketing assets and in the Office's Sites & pages on the next ship. claude.ai artifacts can't load
remote images, so publish the thumbnails with each artifact (Office: `site-*.jpg`; Desk: that listing's thumbs).

## Roadmap (TC)
- **Inbox watcher** (Apps Script, with the next engine deploy): checks the deal inbox every few minutes and flags fires right away (wire or bank-detail emails, "terminate", inspection responses, lender or title problems). Test whether it can also start a TC run immediately; if not, it alerts Chris and the hourly TC run picks it up.
- **Deal inbox** on ranchpnw.com, forwarded into Chris's deal inbox with a label so the TC reads one inbox.
- **Buyer side**: the same TC timeline, drafts and watcher for deals where the Ranch team represents the buyer (a buyer view instead of the seller portal).
- Standing TC rules (fire reviews, signed addenda for date changes, appraisal tracking, county/septic documents, wire fraud) live as "All deals" rows on the TC feedback tab.

## Launch pieces in three looks (source/marketing/pieces.py)
One look per listing: **Estate Editorial** (`editorial`, pairs with Noir signs), **Modern Architectural** (`arch`, Daylight signs),
**Warm Heritage** (`heritage`, Heritage signs). Chris picks it at launch (Office launch sheet or the Desk launch flow) and switches it on
the Desk (Marketing assets → Look). Every piece is built in all three looks so switching is instant.
- Facts: `source/marketing/pieces/<key>.json` (else `source/listings/<key>.json`). Rooms, talkers (silent talkers, 3×5) and reasons are
  written at launch from the photos, remarks and the seller's upgrade list; every line must be verified. Missing facts skip a piece.
- Build: `python3 source/marketing/pieces.py <key>` → `marketing/<key>/<look>/`. ship.sh rebuilds when the facts or templates change.
- Print (Chris picks): postcard-listed, postcard-contract, postcard-sold (only after closing, with the sellers' OK), preview-invite,
  lookbook, room-cards, talkers. Digital (always made): agent-email.html, carousel-N.jpg, and the pending package
  (contract-post / contract-story / contract-square.jpg) once `contract` (mutual date) is set.
- Pending: the Office shows "Under contract · <address>: post it" with the package until Chris taps "I posted them" (Hub done `pend:<key>`).
- Changes: the Concierge (Office or Desk) logs a row on the "Marketing changes" tab (When | Listing | Piece | Change asked | Status | Result
  link | Note). The hourly "Listing marketing" task copies the facts to `source/marketing/pieces/review/<key>.json`, applies the change,
  renders `--review` into `marketing/<key>/review/<look>/`, sets Ready + link; Chris taps Approve or Not quite in the Office; Approved
  replaces the live piece (copy the review JSON over, rebuild, ship) and the row becomes Done.

## The self-improving loop (Nov 25, 2026)
Every scheduled job follows a playbook in `source/playbooks/` (see its README for the list and the loop), plus
`locked-rules.md` and `improve.md`. Sheet tabs: Papercuts, Edits, Seller questions, Seller check-ins, Portal notes,
Improvement review, Deal history, Usage, Research. Shared UI: `source/app/src/improve.js` (weekly review, Something's off,
Seller asked…, seller questions, Arrange, usage) is built into the Desk by `build.py` and into the Office by
`inject_sites.py` (`/*__IMPROVE_UI__*/`, `__LAYOUT__` from `source/office/layout.json`). The copy checker
(`source/checks/copy_check.py`, rules in `copy_rules.json`) runs in ship.sh on every social caption. The seller portal's
"Ask Chris", "Good to know" notes and "How am I doing?" need the engine (`source/apps-script/Code.gs`) deployed.
