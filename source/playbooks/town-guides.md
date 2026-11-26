# Nightly town-guide drafts

Moved here from the scheduled task on Nov 25, 2026 (private address named, not written: **Chris's KW mailbox**).
Also follow `locked-rules.md` and `improve.md`.

You build town-guide drafts overnight for Chris Ranch (The Ranch Real Estate Group, Keller Williams Realty Puget Sound). Chris asked for guides to be built fast: 4 drafts a night, each one approved by him before it goes live.

1. Clone github.com/chrisranch15-gif/homes (attach it with add_repo, push access, if needed). Read CLAUDE.md (the rules; they win over anything else), source/GUIDES.md (plan, queue, draft-first rule, status log) and source/README.md. The quality bar is the Tehaleh guide (gotehaleh.com) and the design system of unlisted.html and reviews.html at the repo root (Playfair Display + Inter, ivory/charcoal/stone, bronze #8C6A43).

2. First run only (if source/guides/ does not exist yet): create a simple static guide builder, source/guides/build_guides.py, that turns source/guides/<town>.json into guides/<town>.html plus guides/index.html, in that design system. Each guide page has: hero (town name, one-line headline), at-a-glance facts (each with a source link), 4–6 chapters (getting around and commutes, parks and outdoors, schools with a "confirm with the district" note, everyday errands, housing and neighborhoods, what's nearby), a "Local picks" section, 8–12 FAQs, sources list, links to any Ranch listing in that town and to homes.ranchpnw.com/unlisted, a call/text CTA (253) 335-5630, the Keller Williams Realty Puget Sound disclosure footer, and JSON-LD (Article, Place, FAQPage, BreadcrumbList) for AEO. Port the already-written Bonney Lake guide from source/app/src/towns.js (PLACES['bonney-lake'] and its SRC keys) into source/guides/bonney-lake.json without changing Chris's words.

3. Take the next 4 towns in the GUIDES.md queue that have no source/guides/<town>.json yet. For each: research with web search and fetch; use official and reputable sources (city, county, school district, WSDOT, parks departments, census/Wikipedia for population). Every number and claim gets a source link; if you can't source it, leave it out. Do NOT invent picks, quotes, opinions or a "day in the life": in the Local picks section write "Chris's local picks are coming soon." Only use photos you are sure show that exact place and that we have rights to; otherwise use a text hero (never stock photos of other places). Write in a warm, plain, helpful voice; "I"/"we" only for Chris's own first-hand parts. Run the copy checker (`--kind print`) on the page text.

4. Drafts are private until Chris approves: build them, but do NOT add them to index.html, sitemap.xml, llms.txt or guides/index.html, and give every draft page <meta name="robots" content="noindex">. Publish each draft for review as a private claude.ai artifact if an artifact tool is available in this session; otherwise commit the draft HTML under drafts/guides/<town>.html (noindex) and link that. Commit and push (main).

5. Send Chris ONE short email (Gmail, to Chris's KW mailbox, the only message you send): subject "Guide drafts · <town list>". For each town: the review link, 3 standout facts, and exactly 3 quick questions for his local picks (favorite food spot, favorite outdoor spot, what buyers don't realize). Say he can answer by voice note and reply "approve <town>" to publish.

6. When a past draft has Chris's approval (look for his reply in Gmail: "approve <town>" or similar), add his answers in his words, remove noindex, add it to guides/index.html, the home page guides section (source/public-site/collection.template.html → index.html), sitemap.xml and llms.txt, then push.

7. Update the status log in source/GUIDES.md (what was drafted, approved, published, and what's waiting on Chris) and commit. Stop once the queue in GUIDES.md is empty.

Never email or message anyone except Chris. Never create domains, DNS records or new repositories. Never publish an unsourced fact. File papercuts per improve.md.
