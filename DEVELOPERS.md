# Start here: a reviewer's guide to the Ranch system

Thanks for taking a look. This page walks the whole system in order, about 20 minutes of reading.

**This is a review only.** Please don't push, open pull requests or change anything in these repos,
the Google Sheet, the Apps Script or the claude.ai artifacts. Send your notes to Chris instead.

## What it is

The business system for The Ranch Real Estate Group (Chris Ranch, Keller Williams Realty Puget Sound).
It runs listing pages, seller and buyer portals, open house sign-ins, contract-to-closing tracking,
marketing drafts and an owner dashboard (the Office). Claude does most of the build and the recurring work;
Chris approves anything a client or the public will see.

## Read in this order

1. **[CLAUDE.md](./CLAUDE.md):** the rules and the map of what lives where. Everything else follows from it.
   The approval, privacy and "the agent is the hero" rules are the heart of the design.
2. **[source/README.md](./source/README.md):** how the pages, the Desk and the engine are built and shipped.
3. **[source/playbooks/README.md](./source/playbooks/README.md)** then **[dispatch.md](./source/playbooks/dispatch.md):**
   how recurring jobs start and run (one hourly check, jobs queued in a Sheet tab).
4. **[source/playbooks/locked-rules.md](./source/playbooks/locked-rules.md)** and **[improve.md](./source/playbooks/improve.md):**
   the guardrails every job follows, and how the system learns from Chris's edits.
5. **[source/apps-script/DEPLOY.md](./source/apps-script/DEPLOY.md):** how the engine goes live.

## The moving parts

| Piece | What it does | Code |
|---|---|---|
| Public site (homes.ranchpnw.com) | Listing pages, town guides, sell page, Unlisted | `source/public-site/`, built files at repo root |
| Engine (Google Apps Script) | Every form, portal and sign-in posts here; writes to the Google Sheet | `source/apps-script/Code.gs` |
| Google Sheet | The data: leads, listings, deals, showings, buyers, the job queue ("To do") | not in the repo |
| The Desk (one listing) | Private claude.ai app for running a single listing | `source/app/` |
| The Office (whole business) | Private owner dashboard; also at office.ranchpnw.com | `source/office/index.html` (copied to [chrisranch15-gif/office](https://github.com/chrisranch15-gif/office)) |
| Seller portal | Showings, feedback and updates for sellers | `source/public-site/sellers.template.html` |
| Buyer portal | Quick questions, photo uploads, homes picked, "the ones that got away" | `source/public-site/buyers.template.html` |
| Open house sign-in and Buyer Pass | Guest sign-in at open houses | `source/public-site/welcome.html` |
| Seller photo preview | Private sneak-peek page when listing photos arrive | `source/public-site/photo_preview.py` |
| Listing films | Runway clips, cached so re-edits cost nothing | `source/video/`, `.github/workflows/listing-film.yml` |
| Nightly site check | Every page, price and form checked | `source/checks/`, `.github/workflows/site-check.yml` |
| Playbooks | Written instructions for each recurring job | `source/playbooks/` |
| Voice and copy rules | How client messages sound; banned words | `source/voice.md`, `source/checks/copy_rules.json` |

## How a typical day flows

- A lead fills out a form → the engine writes a Sheet row → it shows in the Office.
- Something needs doing (photos arrived, an offer accepted, a seller asked a question) → the engine adds a row
  to the "To do" tab → the hourly check runs the matching playbook → drafts land in Gmail or the Office for Chris.
- Chris approves → he sends or posts it himself. Nothing sends on a schedule or on its own.

## Tests

- Desk engine: `source/app/src/tests.js` (run by `source/office/ship.sh`; must be all green).
- Playbooks: `source/playbooks/tests/` (example cases each playbook change is checked against).
- Copy checker: `source/checks/copy_check.py`.

## Things that are deliberately not in the repo

- Client names, emails and phone numbers (they live only in the Sheet).
- Passwords, API keys and tokens (GitHub Secrets or Chris's own accounts).
- Chris's email address and private launch-plan contents.

## Questions worth your eye

- Is the engine (one large Apps Script file) holding up, or should it be split?
- Are the privacy boundaries (sellers never see buyer contacts, and the reverse) enforced in code everywhere?
- Is the build-and-ship flow (`source/office/ship.sh`) simple enough for someone other than Claude to run?
