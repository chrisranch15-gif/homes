/* ---------- Town guides (live.ranchpnw.com/<town>) ----------
   Same record shape as PLACES.tehaleh. First-hand text is the agent's own words, signed; every fact carries a source key. */
Object.assign(SRC, {
  blwiki: ['Wikipedia · Bonney Lake, Washington', 'https://en.wikipedia.org/wiki/Bonney_Lake,_Washington'],
  ayfield: ['City of Bonney Lake · Allan Yorke Field #5', 'https://bonneylake.hosted.civiclive.com/news/what_s_new/allan_yorke_park_field__5_ribbon_cutting_ceremony'],
  ayplay: ['City of Bonney Lake · New playground (Aug 2025)', 'https://bonneylake.hosted.civiclive.com/news/what_s_new/playground___little_league_celebration'],
  victor: ['Courier-Herald · City buys Victor Falls viewpoint (2013)', 'https://www.courierherald.com/2013/09/26/city-of-bonney-lake-purchases-property-with-victor-falls-viewpoint/'],
  regal: ['Cinema Treasures · Regal Tall Firs 10', 'https://cinematreasures.org/theaters/41416'],
  glow: ['Courier-Herald · Glow Martini Lounge (2019)', 'https://courierherald.com/business/customers-glow-with-drinks-food-entertainment'],
  georges: ['Explore Washington State · George’s Bonney Lake Tavern', 'https://explorewashingtonstate.com/business-directory/georges-bonney-lake-tavern/'],
  trappers: ['Trapper’s Sushi · Our story', 'https://trapperssushi.squarespace.com/about'],
  allago: ['OpenTable · Al Lago Ristorante Italiano', 'https://www.opentable.com/r/al-lago-ristorante-italiano-sumner'],
  tehwiki: ['Wikipedia · Tehaleh, Washington', 'https://en.wikipedia.org/wiki/Tehaleh,_Washington']
});
PLACES['bonney-lake'] = Object.assign(PLACES['bonney-lake'], { checked: '2026-11-20', town: true, path: 'bonney-lake',
  headline: 'Ten minutes from everything, with the mountain out.',
  lede: 'Bonney Lake sits along SR-410 in Pierce County, between Sumner and the Cascade foothills, with Lake Tapps at its north end and Tehaleh to the south. Here is what an ordinary week here actually looks like, from a local agent who knows it first-hand.',
  stats: [['22,487', 'people at the 2020 census', 'blwiki'], ['1949', 'incorporated as a town', 'blwiki'], ['45 acres', 'Allan Yorke Park on Lake Tapps', 'ayp'], ['142 acres', 'of city parks', 'ayp']],
  notes: ['The city’s parks page calls Allan Yorke Park “a 45 acre parcel”; a separate city notice about its new turf field mentions converting “nearly 4.8 acres.” We show the parks page’s figure and re-check monthly.'],
  chapters: [
    { picks: true, t: 'From a local agent, first-hand',
      intro: 'We’re a busy family with young kids in sports. These are the places we actually go, and the ones I send everyone to.',
      items: [['The BLT', 'My food pick: George’s Bonney Lake Tavern, right off 410. Same owner as Al Lago and the Island Lodge. Very, very good food, fun places to be.', ''],
        ['Trapper’s Sushi', 'Our sushi place in Bonney Lake. We like eating there.', ''],
        ['Lamppost Coffee', 'Locally owned and very good, right next to Kohl’s. There are also Starbucks everywhere: two right off 410, one inside Fred Meyer (overkill) and one inside Safeway. They’re all good.', ''],
        ['Allan Yorke Park', 'A very fun one to go to, and where local families and dog owners love to be. My favorite field is actually over at Allan Yorke, because they just opened up the soccer and baseball fields.', ''],
        ['Victor Falls, with the dog', 'Down to Victor Falls on the trails. It can be a little dicey in the winter, but it’s a good one.', ''],
        ['Post & Pour, a short drive away', 'If you’re willing to take a quick drive into Tehaleh, grab a coffee or a flatbread at Post & Pour, overlooking the mountain. Very fun, very nice. And if you’re a member, The Mantel.', 'teh-postpour-firepit'],
        ['Chipotle, honestly', 'We are a busy family with young kids in sports, so we also have to say Chipotle, because it’s quick.', '']] },
    { day: true, t: 'A day in the life', kicker: 'A Saturday in Bonney Lake, the way we live it', sig: 'on a Saturday in Bonney Lake',
      intro: 'If you’re an active person, Bonney Lake makes the morning easy: a walk, a park, a jog, then coffee. Here’s how a good Saturday goes for us.',
      moments: [
        ['Morning', 'Out for a walk, a jog, a park', 'There are parks and trails all around. Which ones become yours depends on where you live and how you like to spend a morning. Some of the best aren’t obvious; you have to live here and get a feel for your style.', '', 'ayp'],
        ['Coffee', 'Lamppost, or one of four Starbucks', 'Lamppost by Kohl’s is the local one, and it’s very good. Or pick a Starbucks. You won’t have to look hard.', '', ''],
        ['Afternoon', 'A movie at the Regal', 'It’s not a super updated theater, but it’s a good one to catch newer movies in because it isn’t packed. Most people go to the nicer theaters with the comfy chairs.', '', 'regal'],
        ['Before the movie', 'A quick drink at Glow', 'Glow Martini Lounge is right there if you want a drink beforehand, with plenty of restaurants around it if you want to sit down.', '', 'glow'],
        ['Dinner', 'Al Lago, the Island Lodge, or the BLT', 'We love Al Lago, which is technically Lake Tapps but so close to Bonney Lake, and the Island Lodge by Al Lago. The BLT is right off 410. All the same owner, all very good.', '', 'allago'],
        ['Evening', 'Sunset over the water', 'If you live near Lake Tapps, we love watching the sunset over the water. If you don’t, there are plenty of viewpoints to catch it and walk around.', '', '']],
      honest: [['What people don’t realize until they live here', 'The 410 commute really isn’t that bad. It’s the 167-to-410 interchange that slows you down. And errands are easy: you’re 10 to 15 minutes from almost anywhere in Bonney Lake to Costco, Target or Fred Meyer, so you get things done fast.'],
        ['Who Bonney Lake isn’t for', 'Someone who expects a 10-minute commute. Most people here commute, usually 30 to 45 minutes each way, sometimes more. And if date night means a small family-owned Italian or Mexican place, there are a few very good ones, but a lot of what’s here is chains. People often head to Sumner, Enumclaw, Puyallup or Tacoma for date night.']] },
    { t: 'Where kids and dogs go', dark: true,
      intro: 'Allan Yorke Park is the answer most of the time. It sits on the south end of Lake Tapps, and nearly everything a family wants on a summer day is in one place.',
      items: [['Allan Yorke Park', 'Ball fields, a covered beach area with barbecues, swimming areas, a fishing dock, playgrounds, a skate park, tennis and volleyball courts, trails, a snack shack and kayak and paddleboard rentals. 7203 West Tapps Highway E; closes at dusk.', 'ayp'],
        ['Field #5', 'A multi-sport turf field built for baseball, soccer, lacrosse and rugby.', 'ayfield'],
        ['The new playground', 'The city built a new playground at Allan Yorke and held its celebration in September 2025, alongside a welcome-home parade for the Bonney Lake–Sumner Little League.', 'ayplay'],
        ['Viking Park', 'The city’s off-leash dog park, at 18902 82nd St E.', 'ayp'],
        ['Victor Falls Park', 'The city bought this 3.25-acre property in 2013 to give people a safe place to see the falls. Today it has a falls viewpoint, soft-surface paths, picnic tables, barbecues and parking at 18212 Rhodes Lake Rd E. Closes at dusk.', 'victor']] },
    { t: 'Lake Tapps and the boat launch',
      intro: 'Summer on Lake Tapps is a big part of life here, and it gets busy. Plan for it.',
      items: [['Allan Yorke boat launch: residents only in 2026', 'For the 2026 season the city opened its launch to Bonney Lake residents only, with a trailer parking pass of $40 plus tax ($43.80) per vehicle per year. It opens when Cascade Water Alliance says the lake is at recreational levels, and closes at dusk. The rule can change from year to year, so check before you tow.', 'boating'],
        ['North Lake Tapps Park', 'Pierce County’s park on the north end has a boat ramp and is open to the public first-come, first-served. The launch is typically closed November through March, and it closed early in August 2026 because of drought.', 'nltp'],
        ['The local tip', 'Launching can be difficult on a busy day. It helps to know somebody with private launch access, like a friend on Tapps Island or someone with their own launch. — Chris', '']] },
    { t: 'Errands, and how it compares', dark: true,
      intro: 'Bonney Lake’s main corridor runs along SR-410, which is why errands go fast.',
      items: [['Costco Bonney Lake', 'At 9801 204th Ave E, with gas and a tire center. “One of the best Costcos in the area: multiple exits, multiple entrances. I talk about it all the time. It makes me feel like an old person, but that is a wonderful Costco.” — Chris', 'costco'],
        ['Compared to Tehaleh', 'Tehaleh is a planned community at Bonney Lake’s south end. Next to it, Bonney Lake feels much bigger and more spread out, with a lot more history. — Chris', 'tehwiki'],
        ['Compared to Sumner', 'Sumner is very close, and much more of a cute downtown. Bonney Lake is cute too: you’re overlooking the mountain, there are wonderful places to live and great schools. It’s just more spread out. — Chris', '']] }
  ],
  glance: [['Where', 'Pierce County, Washington, along SR-410 between Sumner and the Cascade foothills', 'blwiki'], ['Population', '22,487 at the 2020 census', 'blwiki'], ['Incorporated', '1949', 'blwiki'],
    ['Lake', 'Lake Tapps borders the city’s north end; Allan Yorke Park is its city beach and launch', 'ayp'], ['Boat launch', 'Allan Yorke: Bonney Lake residents only for 2026, $43.80/yr trailer pass', 'boating'],
    ['Neighborhoods', 'Includes Tehaleh, the planned community at the south end', 'tehwiki'], ['Errands', 'Costco at 9801 204th Ave E; Target, Fred Meyer and Safeway along SR-410', 'costco']],
  faq: [
    ['What is it like to live in Bonney Lake, WA?', 'In Chris Ranch’s experience, it’s an easy place to be active and get things done: parks and trails all around, Lake Tapps in summer, and Costco, Target and Fred Meyer 10 to 15 minutes from almost anywhere in town. It’s more spread out than Sumner, with Mount Rainier views and a lot of history.', ''],
    ['How bad is the commute from Bonney Lake?', 'Most people commute, usually 30 to 45 minutes each way and sometimes more. In Chris’s experience, SR-410 itself isn’t bad; the 167-to-410 interchange is what slows you down.', ''],
    ['Can non-residents use the Allan Yorke Park boat launch?', 'Not in 2026. The city opened the launch to Bonney Lake residents only, with a $43.80 yearly trailer parking pass, and it opens when the lake reaches recreational levels. Pierce County’s North Lake Tapps Park has a public boat ramp, typically closed November through March. Rules change by season, so check before you go.', 'boating'],
    ['Is there a Costco in Bonney Lake?', 'Yes, at 9801 204th Ave E, with gas and a tire center. Chris calls it one of the best Costcos in the area, with multiple entrances and exits.', 'costco'],
    ['Where do families and dog owners go in Bonney Lake?', 'Allan Yorke Park on Lake Tapps first: swimming areas, playgrounds, a skate park, ball fields including a multi-sport turf field, and trails. Viking Park is the city’s off-leash dog park, and Victor Falls Park has a falls viewpoint and soft-surface paths (Chris notes the trails can be dicey in winter).', 'ayp'],
    ['Are there good restaurants in Bonney Lake?', 'There are a few very good local ones. Chris’s picks are George’s Bonney Lake Tavern (the BLT) off 410, Trapper’s Sushi, and Al Lago and the Island Lodge just over in Lake Tapps. A lot of what’s on 410 is chains, so for date night many people head to Sumner, Enumclaw, Puyallup or Tacoma.', ''],
    ['How is Bonney Lake different from Tehaleh?', 'Tehaleh is a planned community at Bonney Lake’s south end, built around its own trails and parks. In Chris’s experience, Bonney Lake as a whole feels bigger and more spread out, with more history.', 'tehwiki'],
    ['How is Bonney Lake different from Sumner?', 'Sumner is very close and is much more of a cute downtown area. Bonney Lake is more spread out, with Mount Rainier views and quick access to Lake Tapps and the big-box errands along SR-410.', ''],
    ['Who is Bonney Lake not a good fit for?', 'Someone who expects a 10-minute commute, or who wants lots of small, family-owned restaurants close by. Most residents commute 30 to 45 minutes each way.', ''],
    ['How many people live in Bonney Lake?', '22,487 at the 2020 census. Bonney Lake incorporated as a town in 1949.', 'blwiki'],
    ['Is there a movie theater in Bonney Lake?', 'Yes. Regal Tall Firs 10, at 20751 SR-410 E, opened in 1997. Chris likes it for newer movies because it isn’t packed.', 'regal']],
  fine: 'Places are described, never the people who live there. Chris’s picks and experiences are his own and are signed. Distances and drive times are approximate. Park rules, launch access and businesses can change.'
});
function townGuide(key) { FN.on = true; FN.list = []; FN.route = key; try { return townBody(key).replace('<!--SOURCES-->', sourcesList()); } finally { FN.on = false; FN.route = ''; } }
function townBody(key) {
  const p = PLACES[key], a = T().agent.name;
  const chap = (c, i) => c.picks ? picksChap(c, i) : c.day ? dayChap(c, i) : `<section class="${c.dark ? 'dark' : ''}"><div class="chapter wrap"><div class="head"><span class="n">${String(i + 1).padStart(2, '0')}</span><h2>${esc(c.t)}</h2></div>
    <div class="gintro"><p class="serif">${esc(c.intro)}</p></div>
    <div class="placelist tplace">${c.items.map(([n, d, s]) => `<div><h3 class="serif">${esc(n)}</h3><p>${esc(d)}</p>${srcLink(s)}</div>`).join('')}</div></div></section>`;
  return `<div class="story m-${L().mode || 'editorial'}">
  <header class="townhero">
    <div class="topnav"><div class="mark"><span class="st">Life in ${esc(p.name)}</span><span class="ct">Pierce County, Washington</span></div><div class="tn"><button class="menu" data-act="share-guide">Share</button><a class="cta" href="https://gotehaleh.com/">Tehaleh guide</a></div></div>
    <div class="copy"><h1><span class="h1k">Living in ${esc(p.name)}, Washington</span>${esc(p.headline)}</h1><div class="eyebrow" style="margin-top:18px">A guide from ${esc(T().name)}</div></div></header>
  <section class="lede narrow"><p class="big">${esc(p.lede)}</p>
    <div class="glance" aria-label="${esc(p.name)} at a glance"><div class="eyebrow">${esc(p.name)} at a glance</div><dl>${p.glance.map(([k, v, s]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)} ${srcLink(s)}</dd></div>`).join('')}</dl><p class="small muted" style="margin:14px 0 0">Updated ${fmtDay(placeChecked(key))} by ${esc(a)}, ${esc(T().name)}.</p></div>
    <nav class="gtoc" aria-label="In this guide">${p.chapters.map((c, i) => `<a href="#${key}" data-scroll="g-${i}">${esc(c.picks ? a.split(' ')[0] + '’s picks' : c.t)}</a>`).join('')}<a href="#${key}" data-scroll="faq">Questions</a></nav></section>
  <section class="wrap" style="padding-bottom:clamp(40px,6vw,72px)"><div class="stats" style="margin-top:0">${p.stats.map(([v, k, s]) => `<div><div class="v">${v}</div><div class="k">${esc(k)}</div><div style="margin-top:8px">${srcLink(s)}</div></div>`).join('')}</div>
    <p class="small muted" style="margin-top:24px;max-width:70ch">${esc(p.notes[0])}</p></section>
  ${p.chapters.map((c, i) => `<div id="g-${i}">${chap(c, i)}</div>`).join('')}
  ${faqBlock(p.name + ' questions, answered', p.faq)}
  <section class="wrap" style="padding-top:clamp(72px,9vw,120px);padding-bottom:clamp(72px,9vw,120px)">
    <h2 class="serif" style="font-size:clamp(30px,3.6vw,46px);margin:0 0 10px">Thinking about ${esc(p.name)}?</h2>
    <p class="muted" style="margin:0 0 32px;max-width:60ch">${esc(a)} sells here often. Choose what’s useful; we only ask for details to send what you ask for.</p>
    <div class="next">
      <div class="card"><span class="eyebrow">First notice</span><span class="t">Homes in ${esc(p.name)}</span><span class="muted">Hear about new listings here before the weekend rush.</span><button class="btn" data-act="place-lead" data-k="alerts">Get first notice</button></div>
      <div class="card"><span class="eyebrow">For sale now</span><span class="t">19917 145th St E, Tehaleh</span><span class="muted">Five bedrooms, Mount Rainier views, backing to the greenbelt.</span><a class="btn ghost" href="https://homes.ranchpnw.com/19917">See the home</a></div>
      <div class="card"><span class="eyebrow">In person</span><span class="t">A guided ${esc(p.name)} tour</span><span class="muted">Parks, the lake and neighborhoods with someone who knows them.</span><button class="btn ghost" data-act="place-lead" data-k="community-tour">Plan a tour</button></div>
      <div class="card"><span class="eyebrow">Ask</span><span class="t">A local question</span><span class="muted">About a neighborhood, the commute or the lake.</span><button class="btn ghost" data-act="ask" data-from="buyer">Ask</button></div>
    </div>
    <p class="small muted" style="margin-top:28px;max-width:70ch">${esc(p.fine)} Sources (listed below) were checked on ${fmtDay(placeChecked(key))} and are re-checked monthly. Post &amp; Pour photo by ${esc(a)}.</p>
  </section>
  <!--SOURCES-->
  ${footer()}</div>`;
}
function townLd(key) {
  const p = PLACES[key], t = T(), url = 'https://live.ranchpnw.com/' + p.path;
  const org = { '@type': 'RealEstateAgent', '@id': 'https://www.ranchpnw.com/#org', name: t.name, url: 'https://www.ranchpnw.com' };
  const biz = [['Restaurant', 'George’s Bonney Lake Tavern', '18212 WA-410'], ['Restaurant', 'Trapper’s Sushi', ''], ['CafeOrCoffeeShop', 'Lamppost Coffee', ''], ['BarOrPub', 'Glow Martini Lounge', '20631 SR 410 E, Suite 301'], ['MovieTheater', 'Regal Tall Firs 10', '20751 State Route 410 E'], ['Store', 'Costco Bonney Lake', '9801 204th Ave E']]
    .map(([ty, n, st]) => ({ '@type': ty, name: n, address: Object.assign(st ? { streetAddress: st } : {}, { '@type': 'PostalAddress', addressLocality: 'Bonney Lake', addressRegion: 'WA', addressCountry: 'US' }) }));
  const parks = [['Allan Yorke Park', '7203 West Tapps Highway E'], ['Viking Park', '18902 82nd St E'], ['Victor Falls Park', '18212 Rhodes Lake Rd E']].map(([n, st]) => ({ '@type': 'Park', name: n, address: { '@type': 'PostalAddress', streetAddress: st, addressLocality: 'Bonney Lake', addressRegion: 'WA', addressCountry: 'US' } }));
  return { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', '@id': url + '#guide', headline: 'Living in ' + p.name + ', WA: a local’s guide', description: p.lede, url, inLanguage: 'en-US', datePublished: p.checked, dateModified: new Date(placeChecked(key)).toISOString().slice(0, 10), author: { '@type': 'Person', name: t.agent.name, worksFor: { '@id': org['@id'] } }, publisher: org, about: { '@id': url + '#place' } },
    { '@type': 'City', '@id': url + '#place', name: p.name, containedInPlace: { '@type': 'AdministrativeArea', name: 'Pierce County, Washington' }, sameAs: SRC.blwiki[1], containsPlace: parks.concat(biz) },
    { '@type': 'FAQPage', mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Life in the Puget Sound', item: 'https://live.ranchpnw.com/' }, { '@type': 'ListItem', position: 2, name: p.name, item: url }] }] };
}
ROUTES['bonney-lake'] = () => townGuide('bonney-lake');
