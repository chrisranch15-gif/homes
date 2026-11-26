# Town guides — plan, queue and daily routine

## Why
First-hand local guides that answer engines (ChatGPT, Claude, Perplexity, Google) can quote, each linking to
Chris's listings in that town. Value comes from lived experience Zillow can't copy: picks, a day in the life,
honest "who it's not for", resident FAQs — plus sourced facts.

## Domains (updated Nov 23, 2026)
- New guides: **homes.ranchpnw.com/guides/<town>** (decided Nov 23 with Chris: one domain builds one site's authority for search and AEO,
  and it unblocks publishing — the live.ranchpnw.com repo/DNS never got set up). live.ranchpnw.com is dropped.
- Tehaleh stays at **gotehaleh.com** (Chris owns it). Listings at **homes.ranchpnw.com/<listing>**.
- Guides and listings link to each other; nothing is published twice.
- Longer term: Chris may move ranchpnw.com off the KW site; then everything can consolidate under it.
- myfoxisland.com exists with Fox Island info (no IDX) — decide with Chris how the Fox Island guide relates to it before building.

## Queue (Chris, Nov 23: build fast, 4 a night, as drafts he approves)
Night 1 (Nov 23): Bonney Lake (move the written guide to homes.ranchpnw.com/guides/bonney-lake), Gig Harbor, Fox Island, Renton
Night 2 (Nov 24): Lake Tapps, Tacoma, Enumclaw, Burien
Night 3 (Nov 25): Port Orchard, Edgewood, then Federal Way, Puyallup
Then: Fife, Auburn, Kent, Sumner, Seattle.
Renton, Burien, Port Orchard and Edgewood have current Ranch listings (Port Orchard is vacant land): link each guide to its listing page.
~~Tehaleh~~ is live at gotehaleh.com.

## How guides are built (from Nov 23)
Data: `source/guides/<town>.json` (schema in `source/guides/SCHEMA.md`). Builder: `python3 source/guides/build_guides.py`
writes only guides with `"status": "published"` to `guides/<town>.html` + `guides/index.html`;
`--drafts <dir>` builds drafts (noindex, images inlined) for private review as claude.ai artifacts (link in each JSON's `review`).
Approving a guide: add Chris's answers in his words (a `"kind": "picks"` chapter), set status to published, rebuild,
then add it to the home page guides section (`source/public-site/collection.template.html` → `index.html`), sitemap.xml and llms.txt.

## Draft-first rule
A draft is built from sourced facts only (every number and claim links to its source). Chris's first-hand parts
(picks, a day in the life, who it's not for) are added from his interview answers; until then the draft says
"Local picks coming soon" rather than inventing any. Nothing goes live until Chris approves the draft.

## Each guide contains
- At-a-glance facts (sourced), chapters with real photos (credited), Chris's (or the local agent's) picks,
  **a day in the life** in their voice, honest "what people don't realize" and "who it's not for", 8–12 FAQs,
  nearby essentials, links to current listings, JSON-LD (Article, Place with LocalBusiness entries, FAQPage, BreadcrumbList).

## Daily routine (scheduled task)
Each morning: send Chris 5 short interview questions for the next guide in the queue (and 1–2 facts to confirm).
When Chris answers, write that section in his voice, source any facts, rebuild, push, and report.
Keep it to ~10 minutes of Chris's time. Quality over count: 2–3 strong guides a week.

## Status log
- 2026-11-19 — Tehaleh guide live with day in the life (Hounds Hollow → activity trail → Post & Pour, Tehaleh Heights walk to school, Halloween, The Mantel). Bonney Lake is next.
- 2026-11-20 — Bonney Lake interview sent: 5 questions (Saturday day in the life, 3 picks, kids/dogs, what surprises buyers incl. SR-410/lake traffic, who it's not for) + 2 facts to confirm (2020 pop. 22,487 per Wikipedia; 2026 Allan Yorke boat launch residents-only, $43.80/yr pass per city boating page). Answered same day.
- 2026-11-20 — Bonney Lake guide written from Chris's voice-note answers: picks (BLT, Trapper's Sushi, Lamppost, Allan Yorke, Victor Falls, Post & Pour), a Saturday in the life, kids & dogs, Lake Tapps launch, errands/compare, honest notes, 11 FAQs, 12 sources. Source in `source/app/src/towns.js` (route `bonney-lake`); builds to site `live` → live.ranchpnw.com/bonney-lake plus a guides index at `/`. **Blocked on Chris:** create repo `chrisranch15-gif/live` (grant Claude app access) and DNS CNAME `live` → `chrisranch15-gif.github.io`; then rebuild, push sites/live to that repo, enable Pages + HTTPS. No Bonney Lake photos yet (text hero; only Chris's Post & Pour photo used) — ask Chris for his own shots of Allan Yorke, a Lake Tapps sunset, Victor Falls. Chris thought non-residents could launch at Allan Yorke; page shows the city's 2026 residents-only rule with source. Next run: if live repo still missing, remind once; otherwise start Fox Island (decide relation to myfoxisland.com first).
- 2026-11-21 — Fox Island interview sent: 5 questions (perfect day, 3 spots, kids/dogs, what surprises residents incl. bridge/wells/storms, who it's not for) + 2 facts to confirm (2020 pop. 3,921 and bridge opened Aug 28, 1954 per Wikipedia; Pierce County replacement-bridge EIS with east/west alternatives per piercecountywa.gov/9131). Also asked how the guide relates to myfoxisland.com. Bonney Lake still blocked: repo `chrisranch15-gif/live` not found and live.ranchpnw.com unverified; reminded Chris once (don't repeat). Awaiting answers.
- 2026-11-22 — Fox Island answers still outstanding; re-sent the same 5 questions + 2 facts + myfoxisland.com question (no new guide started). Couldn't check `chrisranch15-gif/live` (run only has homes repo access); Bonney Lake still blocked.
- 2026-11-23 — Fox Island answers still outstanding (3rd ask); re-sent the same 5 questions + 2 facts + myfoxisland.com question. No new guide started. Bonney Lake still blocked on live repo/DNS.
- 2026-11-23 (night 1, overnight build) — Guide builder created (`source/guides/`). Drafted 5 private review drafts (noindex, not in index/sitemap/llms.txt): **Bonney Lake** (ported unchanged from towns.js; target homes.ranchpnw.com/guides/bonney-lake) [review](https://claude.ai/artifact/2ghqvwiU7gqf6aaihJHyvq), **Gig Harbor** [review](https://claude.ai/artifact/MLC1bspEE5Ao4GtYAVPjeu), **Renton** (links 11532) [review](https://claude.ai/artifact/W6hPkXhihUW2sBmmxTzMHC), **Lake Tapps** [review](https://claude.ai/artifact/4tPCHuML6mMXJCoRoasZRG), **Tacoma** [review](https://claude.ai/artifact/4e9GNppuUzhUzS1x3Qpa5f). New towns are sourced facts only; "Chris's local picks are coming soon." Fox Island skipped on purpose (still waiting on how it relates to myfoxisland.com), so Lake Tapps and Tacoma were pulled forward from night 2. Emailed Chris one "Guide drafts" email with links, 3 facts and 3 picks questions per town. **Waiting on Chris:** "approve <town>" + picks answers for each; Fox Island/myfoxisland.com decision. Published: none yet. Next night: Enumclaw, Burien, Port Orchard, Edgewood (Fox Island when decided).
- 2026-11-24 (night 2, overnight build) — No approvals yet: no reply from Chris on the Nov 23 "Guide drafts" email, and no Fox Island/myfoxisland.com answer, so nothing published. Drafted 4 more private review drafts (noindex, not in index/sitemap/llms.txt; sourced facts only, "Chris's local picks are coming soon"): **Enumclaw** [review](https://claude.ai/artifact/4wqRwkrQZSWEQ8FdRQnD2m) (Metro bus details rest on Wikipedia only; recheck with Metro before publishing), **Burien** (links 12005) [review](https://claude.ai/artifact/4nmYzMzxVHuiyXPooSqFwj), **Port Orchard** (links Sedgwick land) [review](https://claude.ai/artifact/9KwHB6FZ1qnYiKdDCMzjAo), **Edgewood** (links 10707) [review](https://claude.ai/artifact/BLi7xjyVZXebhkzeVy9qtK). Burien and Edgewood census figures are 2019–2023 (newer QuickFacts page didn't load); noted in each JSON. Emailed Chris one "Guide drafts" email. **Waiting on Chris:** "approve <town>" + picks answers for all 9 drafts; Fox Island decision. Published: none yet. Next night: Federal Way, Puyallup, Fife, Auburn (Fox Island when decided).
- 2026-11-25 (night 3, overnight build) — No approvals yet: neither "Guide drafts" email (Nov 23, Nov 24) has a reply, and there's no Fox Island/myfoxisland.com answer, so nothing published. Drafted 4 more private review drafts (noindex, not in index/sitemap/llms.txt; sourced facts only, "Chris's local picks are coming soon"; no Ranch listings in these towns): **Federal Way** [review](https://claude.ai/artifact/3ZmK42ZrqaokUfqZvyDdTv) (Wild Waves closure date unconfirmed; City and Census population/park counts differ, noted), **Puyallup** [review](https://claude.ai/artifact/Tnba2HgMXdfmmZY48335qo) (Riverwalk Trail flood closure status unconfirmed; services facts from the county's draft hazard annex; lahar-zone lines for Chris to review), **Fife** [review](https://claude.ai/artifact/ELWp1FMn6pEZ7Jg549wnDC) (light rail station is the preferred alternative only, service 2035; SR 167 end date 2029 vs 2030), **Auburn** [review](https://claude.ai/artifact/TQcUswDCZ8KXgWWDSn5gek) (Pierce County-side school district, Dieringer vs Auburn SD, needs confirming with the districts). Census figures for these four are 2020–2024. Emailed Chris one "Guide drafts" email. **Waiting on Chris:** "approve <town>" + picks answers for all 13 drafts; Fox Island decision. Published: none yet. Next night: Kent, Sumner, Seattle (then the queue is empty apart from Fox Island).
