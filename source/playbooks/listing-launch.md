# Listing launch

Read `source/marketing/brain/brain.md` first. Also follow `locked-rules.md` and `improve.md`, and CLAUDE.md
(every fact verified, photos only of the home, credit Anthony Jones / Rainier Real Estate Photography, KW disclosure,
the agent is the hero, Chris's direct line only).

A listing launches **on its own as soon as its photos are in** (Photo shoots tab Status "Ready" or "Delivered", or photos
already in `photos/<key>/`); Chris doesn't need to tap anything (Chris, Nov 26, 2026: "Should I need to click launch
listing?" No). The Office's Launch button just fires this task sooner, with the address. It also runs hourly, 8 AM to 6 PM. Chris, Nov 26, 2026: "Why not just start it." Start at once, do everything that
can be done, and leave clear notes in the Office for anything that's waiting on him.

## Each run
1. **Find launches to work on.** Listings tab rows with Status "Preparing" whose page isn't built yet (and any
   "Launch requested" row on the Marketing tab). If the Office's message names one, do it first. A listing whose photos
   aren't in yet just gets "waiting for photos" (step 3). Key = street number.
2. **Facts.** `source/listings/<key>.json` (see `source/listings/README.md`). If it doesn't exist, create it from what's
   verified: the Listings tab (address, city, price, sellers), public record (Realist, if a session can reach it),
   the photo shoot and the Launch notes. If two sources disagree (price, square feet, beds), don't pick: keep the
   field hidden (e.g. `sqft_note`), file a papercut, and add a Needs-you row for Chris (Marketing tab: [now, address,
   "Launch: needs your answer", "<the question in one line>", ""]). Never invent a fact.
3. **Photos.** If `photos/<key>/` is missing, get them from the "Shoot photos" tab, or from the Photo shoots row's
   download page (column I, Rainier's delivery page: open it in a browser, use its "download all" link). When the
   delivered Drive photos are known, write `source/photos/<key>.json` (same shape as the others) and push: the "Listing photos from Drive"
   action downloads and sizes them. Wait for it (check photos/<key>/index.json after a few minutes). If photos aren't
   delivered yet, note "waiting for photos" and stop here for this listing.
3b. **Photo preview for the sellers: do this first, the moment photos are in.** Sellers want their photos right away
   (Chris, Nov 26, 2026), so this comes before everything else in the run. Set `preview` in the facts file (hero, a trio of
   the best three, room groups, near-duplicates in `skip`), run `python3 source/public-site/photo_preview.py <key>`, look
   at it on a phone, and push so it's live. Then draft the email in Chris's KW mailbox (Gmail draft only, with his
   signature; never send). Find the sellers' emails in his inbox (their messages about the address) or the Sellers tab.
   Wording Chris approved (Nov 26, 2026), subject "Your photos are in":
   "Hi <first names>, / We have your photos, and they look amazing. Here's a first look at your home. [link] / We're so
   excited to get your home live and on the market. / Chris"
   Then add the Marketing tab row the Office shows at the top of Up next:
   [now, address, "Photo preview ready", "<the Gmail draft's link>", "<preview link>#for=<first names>"].
   Seller names and emails go only in the draft, the Sheet and the link's #for= part, never in the repo.
4. **Write the page's words** (lede, features, groups, story, details) from the photos and verified facts, per the brain
   (the client is the hero; specific beats superlative; Fair Housing). Run the copy checker (`--kind print`).
5. **Build:** `python3 source/public-site/listing.py <key>` (a listing with no MLS number builds as a private preview:
   noindex, "Coming soon"), `python3 source/marketing/pieces.py <key> og`, add `source/marketing/pieces/<key>.json`
   if needed and `python3 source/marketing/pieces.py <key>` (all print and digital pieces in all three looks, with the
   look Chris chose at launch: Design usage tab "chosen at launch"), the seller portal (Sellers tab row with a code; the
   portal reads it), and the social "listed" set (social-posts.md; it may be fired as its own task). Look at every page
   and image you made like a senior designer before shipping.
6. **Ship** per CLAUDE.md rule 19 (ship.sh, push both repos, publish the Office and the Desk). Don't add the page to the
   public index, sitemap or llms.txt until it has an MLS number and Chris has approved it.
7. **Tell Chris in the Office:** Marketing tab row [now, address, "Launch ready for your review", "<what's ready>",
   "<preview link>"], set the Listings tab Status to "Ready for review", and set its Photo column (J) to the front
   photo's URL so the Office shows the home instead of a blank square. When Chris approves (Marketing tab or the
   Concierge), add the MLS number when he gives it, rebuild (it goes public and indexed), and set Status "Active".

Never post, send, email or publish anything public without Chris's OK. File papercuts for anything that slowed you down.
If nothing needs doing, end with "Quiet."
