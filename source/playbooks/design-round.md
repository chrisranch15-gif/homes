# Weekly design round

Moved here from the scheduled task on Nov 25, 2026. Read `source/marketing/brain/brain.md` first (the marketing strategy: the story, the moment, what to say). Also follow `locked-rules.md` and `improve.md`.

WEEKLY DESIGN ROUND for Chris Ranch (The Ranch Real Estate Group, Keller Williams Realty Puget Sound). Chris asked for this on Nov 25, 2026: track which listing-marketing looks actually get used, and once a week bring new design ideas as MOCKUPS FIRST, so weak looks can be cycled out. Nothing live changes from this task.

SETUP: attach github.com/chrisranch15-gif/homes with add_repo (read access is enough) and clone it. Read CLAUDE.md (its rules win) and the "Launch pieces in three looks" section of source/README.md. The three current looks are Estate Editorial (editorial), Modern Architectural (arch) and Warm Heritage (heritage); their tokens are LOOKS in source/marketing/pieces.py. Google Sheet: 1ROkc-18VbSn7kkLZYrTyJYiooMDLbBxYR0SSWItll2E.

1. USAGE. Read the "Design usage" tab (When | Listing | Look | Piece | Action | Where; actions: chosen at launch, switched to, opened, copied link), the "Social posts" tab (which posts Chris approved) and the "Design ideas" tab. Tally, for the last 7 days and all time: launches per look, switches to each look, and opens/copies per look and per piece. Note which pieces are never opened (they may not be worth printing).

2. ONE NEW LOOK A WEEK, as mockups. Design one new look that fills a gap the usage suggests (for example, if a look is rarely chosen, an alternative to it; if one dominates, a fresh variation of it). Keep it on-brand for a luxury Puget Sound listing agent, never imitate another company's branding, no AI tropes (no gradient washes, emoji, left-border cards). Make it a new artifact from the Design type (list_types, then create_from_type, title "Design round · week of <date> · <look name>") with 3 artboards using a real current listing's verified facts and photos from the repo: the Just Listed postcard front, the lookbook cover and one Instagram carousel slide. Photos must show the place they sit next to; credit Anthony Jones / Rainier Real Estate Photography on print pieces; include the KW brokerage disclosure on print. Add a sticky note with the usage numbers and why this look.

3. Append one row to "Design ideas": week of (YYYY-MM-DD) | the look's name | the mockup link | a one-line usage summary and suggestion (e.g. "Modern Architectural chosen 0 of 4 launches; suggest replacing it") | leave Chris's call blank | leave Done blank.

4. If an earlier "Design ideas" row has Chris's call "Adopt" or "Replace <look>" and Done is blank, do NOT build it here: say in the summary that it is approved and waiting for a build session (the build adds the look to source/marketing/pieces.py LOOKS and the sign styles, rebuilds and ships).

Never change pieces.py, the live looks, either repo, the Office or the Desk from this task. Never send any email or message. File papercuts per improve.md. Finish with a push-worthy first line: "Design round: <look name> mockups are ready. <one-line usage headline>." then the mockup link and the usage tally.
