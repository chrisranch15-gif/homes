# Town guide JSON (source/guides/<slug>.json)

Built by `build_guides.py` into `guides/<slug>.html` (published) or a private draft (status "draft").

```json
{
  "slug": "gig-harbor", "name": "Gig Harbor", "county": "Pierce County",
  "status": "draft",                       // "draft" until Chris approves; then "published"
  "checked": "2026-11-23",                 // date sources were checked
  "headline": "One plain line, no hype.",
  "lede": "2–3 sentences: where it is and what the guide covers.",
  "sources": { "wiki": ["Publisher · Page title", "https://..."] },   // every key used below must exist here
  "stats":  [["21,000", "people at the 2020 census", "wiki"]],          // 3–4 big numbers
  "glance": [["Population", "...", "wiki"]],                            // 6–9 facts, each with a source key
  "notes":  ["optional caveat, e.g. two sources disagree"],
  "chapters": [                                                         // 4–6 sourced chapters
    { "title": "Getting around and commutes", "intro": "...", "dark": false,
      "items": [["Name", "Text", "srcKey"]] }
  ],
  "picks": null,                                                        // null → "Chris's local picks are coming soon."
  "faq": [["Question?", "Answer.", "srcKey"]],                          // 8–12
  "listings": [{ "eyebrow": "For sale now", "title": "...", "desc": "...", "url": "https://homes.ranchpnw.com/..." }],
  "fine": "Small print."
}
```
Chris's own words (picks, a day in the life, honest notes) use chapters with `"kind": "picks"` or `"kind": "day"` and are signed; they are never presented as sourced facts.
