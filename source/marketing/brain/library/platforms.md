# What the platforms say they reward (our own summary)

Studied Nov 26, 2026 (deep study). Official sources first; "secondhand" means a reliable outlet reporting what the
platform said. Paraphrased, never copied. When a platform changes its guidance, the weekly review updates this file.

## Instagram
- **Feed** ranks on what the viewer has done (likes, saves, shares, comments), how fast a post is picking up, the
  poster, and the viewer's history with the poster. It predicts time spent, comments, likes, shares and profile taps.
  ([Instagram Ranking Explained](https://about.instagram.com/blog/announcements/instagram-ranking-explained), May 31, 2023)
- **Stories** rank on viewing and engagement history and closeness; predicted actions are taps, replies, moving on.
- **Explore** leans on the post itself more than Feed; predicted actions are likes, **saves** and **shares**.
- **Reels** predict reshares, watching to the end, likes and audio-page visits. Watermarked or recycled Reels are
  shown less. (same source)
- **The three biggest signals** (Adam Mosseri, Jan 2025, secondhand): **watch time, likes per reach, and sends per
  reach**. Sends (someone DMs your post to a friend) matter most for reaching new people.
  ([Social Media Today](https://www.socialmediatoday.com/news/instagram-shares-algorithm-2025/738034/), Jan 22, 2025)
- **Originality (expanded Apr 30, 2026):** accounts that mostly repost others' work stop being recommended; now covers
  photos and carousels, not just Reels. Original = your own photos/video/design, or someone else's material you
  materially changed with information, context or a point of view. A border, watermark, subtitles or a caption credit
  is not enough. ([Rewarding original creators](https://creators.instagram.com/blog/rewarding-original-creators-on-instagram), Apr 30, 2026)
- **Trial Reels:** a toggle shows a Reel to non-followers first; results after about 24 hours; you can then share it
  to followers. Good for testing a hook without spending the main feed.
  ([Trial reels](https://creators.instagram.com/blog/instagram-trial-reels), Dec 10, 2024)
- Practical reading (Inman, adapting Mosseri, Nov 30, 2025): a hook in the first 3 seconds; on-screen captions
  because many watch muted; a location tag; collab posts.
  ([Inman](https://inman.com/2025/11/30/instagram-for-real-estate-marketing-youre-missing-reach-if-you-dont-do-these-5-things))

## Facebook
- **Originality (Mar 13, 2026):** original means filmed or produced by the Page owner. Re-uploads, stitched clips
  and small edits (borders, captions, speed) are demoted.
  ([Meta](https://about.fb.com/news/2026/03/rewarding-original-creators-on-facebook/), Mar 13, 2026)
- **Demoted:** engagement bait (asking people to vote, share, comment, tag or like in order to boost reach),
  clickbait headlines, disguised links. ([Meta: types of content we demote](https://transparency.meta.com/features/approach-to-ranking/types-of-content-we-demote/),
  list updated Jul 2025; summarized secondhand by [Press Gazette](https://pressgazette.co.uk/news/facebook-shares-publisher-dos-and-donts-to-avoid-content-demotion-in-user-news-feeds/))
- So: a genuine question ("Who do you know who's been waiting for a place like this?") is fine; "Tag 3 friends" or
  "Share this to win" is bait.
- Meaningful conversation among friends ranks above passive Page content (2018 Feed change, still the backbone).
  ([Meta](https://about.fb.com/news/2018/01/news-feed-fyi-bringing-people-closer-together/), Jan 2018)
- No current official statement on link posts' reach; treat claims about link penalties as unverified.

## Google Business Profile
- **Local ranking = relevance, distance, prominence.** Prominence includes reviews (count and rating) and links.
  Google's own tips: complete and accurate profile, respond to reviews, add photos and videos. You can't pay to rank.
  ([Improve your local ranking](https://support.google.com/business/answer/7091?hl=en), no date on page; read Nov 26, 2026)
- **Posts policy:** posts must follow the prohibited/restricted content rules; posts that include **phone numbers,
  emails or social handles may be removed**. Use the post's "Call now" button instead, which uses the verified number.
  ([Photos, videos and posts policy](https://support.google.com/business/answer/7213077?hl=en), no date on page; read Nov 26, 2026)

## Google Search, AI Overviews and structured data
- **Helpful, people-first content:** write for people, not rankings; make clear who wrote it (a real byline), how it
  was made, and why it exists. Trust is the core of E-E-A-T; it matters more for money topics like buying a home.
  Mass-produced text made mainly to rank breaks spam policy.
  ([Creating helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), updated Oct 5, 2026)
- **AI Overviews / AI Mode:** no special optimization or schema needed. A page just has to be indexed and eligible for
  a snippet; structured data must match what's visible.
  ([AI features and your website](https://developers.google.com/search/docs/appearance/ai-features), updated Dec 10, 2025)
- **Structured data rules:** mark up only what's on the page, keep it current, use the most specific type; valid
  markup doesn't guarantee a rich result. ([General guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies), updated Jul 10, 2026)
- **FAQ rich results are gone for everyone** (limited to government/health sites Aug 2023; dropped entirely May 7,
  2026). FAQ sections still help readers and answer engines; they just won't show as a rich result.
  ([Search Central blog](https://developers.google.com/search/blog/2023/08/howto-faq-changes); [Search Engine Journal](https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/), 2026)

## schema.org types for our pages
- `RealEstateListing` (a kind of WebPage; `datePosted`) for a listing page. ([schema.org](https://schema.org/RealEstateListing))
- `SingleFamilyResidence` (Place > Accommodation > House) for the home itself: `numberOfBedrooms`,
  `numberOfBathroomsTotal`, `floorSize`, `yearBuilt`, `address`. ([schema.org](https://schema.org/SingleFamilyResidence))
- `RealEstateAgent` (a LocalBusiness) for Chris/the team; Google's LocalBusiness docs want name and address,
  recommend geo, hours, phone, url. ([Google](https://developers.google.com/search/docs/appearance/structured-data/local-business), updated Sep 8, 2026)
- `Offer` (price, availability), `BreadcrumbList`, `FAQPage` are fine to use for meaning; Google shows **no**
  real-estate-listing rich result. Rich results it supports that we can use: Breadcrumb, Organization/Local
  business, Video, Event (open houses), Profile page.
  ([Search gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery), updated Oct 16, 2026)
