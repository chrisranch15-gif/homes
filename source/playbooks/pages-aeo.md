# Pages and answer engines (AEO)

Also follow `locked-rules.md`, `improve.md` and `source/marketing/brain/brain.md` (§9).
Pages: listing pages, reviews, selling, Unlisted, town guides, gotehaleh.com (source/public-site/, source/guides/).

**The design is locked.** Chris loves how the pages look. Never change layout, typefaces, colors, photos' placement or
the build templates' look. What may improve: the words, the FAQ questions and answers, headings' wording, image alt
text, internal links, and the structured data (JSON-LD), sitemap.xml and llms.txt.

## The goal
Every page is the best answer on the internet to the real questions people ask, so Google, ChatGPT, Perplexity
and AI Overviews find it, trust it and quote it, and name Chris Ranch / The Ranch Real Estate Group.

## Monthly check (run by the weekly review in the first week of each month)
1. Keep a list of 20–30 target questions in `source/checks/aeo-questions.json` (by page: "What's it like to live in
   Tehaleh?", "Best listing agent in Gig Harbor for luxury homes", "How long does it take to sell a home in Bonney
   Lake?", "Homes for sale in Tehaleh with a view of Mount Rainier"). Add questions sellers and buyers actually ask
   (Seller questions tab, Leads tab).
2. Search each one (web search) and note: does a homes.ranchpnw.com / gotehaleh.com page appear, and is Chris named?
   Record the result with the date in `source/checks/aeo-results.json`.
3. For questions where we don't appear, propose (as weekly-review items, plain words) the exact change: a new FAQ
   with a sourced answer, a clearer heading, a missing fact with its source, FAQPage/Place/RealEstateListing JSON-LD,
   an internal link. Every fact verified and sourced; nothing invented.
4. After approval: edit the source, rebuild, check the page looks identical (screenshot before/after), push.

Never stuff keywords, never write content for machines that a person wouldn't want to read, never claim rankings.
