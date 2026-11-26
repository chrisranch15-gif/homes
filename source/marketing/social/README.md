# Social posts: the copy brief

One file per listing moment: `<key>-listed.json`, `<key>-pending.json`, `<key>-sold.json`.
`source/marketing/social.py` designs the slides; this file holds the words. `ship.sh` rebuilds a set
whenever its JSON is newer than `marketing/<key>/social-<event>.json`. The Office and the Desk show each
post as it will look on Instagram, Facebook, Stories and Google; Chris taps Approve and only then is it
scheduled in Metricool. Nothing posts on its own.

## Write it like the best in the business
- **Hook first.** The first line works alone in the feed ("Under contract in five days."). No "Just listed!!", no emoji runs.
- **One idea per slide.** Cover = the news. Then the proof (dates, the three reasons). Then the invitation. Four slides is plenty.
- **Specific beats superlative.** "Mount Rainier from the primary suite" beats "stunning views". Never "dream home", "won't last", "must see".
- **Speaks as Chris** ("I", "we"). Warm, direct, human. Never mentions AI, a system or automation.
- **Every fact is verified** from the listing record (`source/marketing/pieces/<key>.json` or `source/listings/<key>.json`).
  No buyer or seller names, no offer counts, no price talk on pending posts unless Chris says so.
- **Per network:** Instagram ends with name · team · phone · KW line, then 4–6 local hashtags.
  Facebook: no hashtags, one link. Google: no hashtags, under 1,500 characters, name and phone in the text. Stories: no caption, two frames.
- **Photos:** only photos of this home. Keep Holly's mountain photos off any slide set that carries the Anthony Jones credit.

## Slide layouts
`cover` (photo + lockup) · `statement` (two lines, alternating italic, optional photo strip) · `feature` (photo over a reason)
· `list` (eyebrow, headline, 3–4 numbered reasons) · `close` (invitation, Chris, disclosure; optional photo).
Formats: `feed` 1080×1350, `story` 1080×1920, `gbp` 1200×900. Posts: `id`, `network` (instagram, facebook, gmb, or "instagram,facebook" for stories), `kind`, `format`, `when` (local, YYYY-MM-DDTHH:MM), `slides`, `caption`.
