# Town guides — plan, queue and daily routine

## Why
First-hand local guides that answer engines (ChatGPT, Claude, Perplexity, Google) can quote, each linking to
Chris's listings in that town. Value comes from lived experience Zillow can't copy: picks, a day in the life,
honest "who it's not for", resident FAQs — plus sourced facts.

## Domains (decided Nov 19, 2026)
- New guides: **live.ranchpnw.com/<town>** (one site so every link and share builds the whole network).
- Tehaleh stays at **gotehaleh.com** (Chris owns it). Listings at **homes.ranchpnw.com/<listing>**.
- Guides and listings link to each other; nothing is published twice.
- Longer term: Chris may move ranchpnw.com off the KW site; then everything can consolidate under it.
- myfoxisland.com exists with Fox Island info (no IDX) — decide with Chris how the Fox Island guide relates to it before building.

## Queue
1. ~~Tehaleh~~ — live at gotehaleh.com (chapters, Chris's picks, day in the life, FAQ, at-a-glance)
2. **Bonney Lake** — next (Tehaleh is a neighborhood within it; Lake Tapps, Allan Yorke Park, SR-410 corridor, Costco)
3. Fox Island
4. Gig Harbor
5. Lake Tapps
6. Tacoma
7. Federal Way
8. Then outward: Puyallup, Fife, Auburn, Kent, Enumclaw, Renton, Seattle — ideally each with picks from a Ranch agent who lives there

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
