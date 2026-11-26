/* ============================================================
   FOLLOW THIS HOME (buyers) · personal link is the sign-in
   ============================================================ */
function followerData() { if (!session.follower) return null; try { return E.followerView(LID, session.follower); } catch (e) { return null; } }
function followSheet() {
  const f = followerData();
  if (f && f.follower.active) return sheet(`<div class="eyebrow">Following</div><h3>You’re already following ${esc(street())}.</h3><a class="btn wide" href="#following">Open my homes</a>`);
  sheet(`<div class="eyebrow">Follow this home</div><h3>Be the first to know.</h3><p class="muted small" style="margin-top:-6px">A note the moment the price changes, an open house is set, or the status changes. Nothing else.</p>
  <form data-form="follow">${contactFields('f')}${honeypot()}
  <button class="btn wide">Follow this home</button><p class="consent-note">By following, you agree to texts or emails about this home only. Reply STOP or tap “Stop following” any time.</p></form><p class="small muted" style="margin-top:14px">No password. You get a personal link — that’s your sign-in.</p>`);
}
function following() {
  const f = followerData(), l = L();
  if (!f) return `<div class="private"><div class="phone"><div class="pbar"><span class="mark">MY HOMES</span><a href="#story" class="small">Back to the home</a></div>
    <div class="pad" style="padding-top:48px;padding-bottom:60px"><h1 class="serif" style="font-size:34px;margin:0 0 10px">Your saved homes.</h1><p class="muted">Open the personal link we sent you, or enter its code.</p>
    <form data-form="follow-login"><div class="field"><label for="fl">Your code</label><input id="fl" name="code" placeholder="FW-XXXXX" autocapitalize="characters" required></div><button class="btn wide">Open</button></form>
    ${ui.followError ? '<p class="small" style="color:var(--warn)">That code didn’t match.</p>' : ''}<p class="small muted" style="margin-top:22px">Not following yet? <a href="#story">See the home</a> and tap Follow.</p></div></div></div>`;
  const st = { under_contract: 'Under contract', closed: 'Sold', active: 'Available', market_engagement: 'Available', coming_soon: 'Coming soon' }[f.state] || 'Not on the market';
  const avail = ['active', 'market_engagement'].indexOf(f.state) >= 0;
  return `<div class="private"><div class="phone"><div class="pbar"><span class="mark">MY HOMES</span><button class="btn text small" data-act="follow-out">Sign out</button></div>
  <div class="pad" style="padding-top:28px"><p class="small muted" style="margin:0">${greeting()}${f.follower.name ? ', ' + esc(f.follower.name.split(' ')[0]) : ''}</p><h1 class="serif" style="font-size:34px;line-height:1.12;margin:6px 0 18px">The homes you’re following</h1></div>
  <a href="#story" class="fcard">${img(l.heroPhoto || 'front-dusk', '', 'style="width:100%;height:240px;object-fit:cover"')}<div class="pad" style="padding-top:16px;padding-bottom:18px">
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline"><span class="serif" style="font-size:22px">${esc(street())}</span><span class="tag ${avail ? 'ok' : 'mute'}">${st}</span></div>
    <div class="small muted" style="margin-top:4px">${f.price ? LC.money(f.price) + ' · ' : ''}${V('beds')} beds · ${V('baths')} baths · ${esc(V('community'))}</div></div></a>
  <div class="pad" style="padding-top:26px"><div class="eyebrow" style="color:var(--muted);margin-bottom:12px">What’s changed</div>
    <div class="list">${f.feed.length ? f.feed.map(u => `<div><span style="color:var(--accent)" aria-hidden="true">●</span><span><b>${esc(u.title)}</b> — ${esc(u.text)}</span><span class="when">${ago(u.at)}</span></div>`).join('') : '<div class="muted">Nothing yet. You’ll get a note the moment something changes.</div>'}</div></div>
  <div class="pad" style="padding-top:26px;display:flex;flex-direction:column;gap:10px">${avail ? '<button class="btn wide" data-act="tour">Request a private tour</button>' : ''}
    <button class="btn ghost wide" data-act="place-lead" data-k="alerts">${avail ? 'Also send me similar Tehaleh homes' : 'Send me homes like this one'}</button>
    <a class="btn ghost wide" href="#tehaleh">Life in Tehaleh</a></div>
  <div class="pad" style="padding:30px 24px 60px"><div style="border-top:1px solid var(--line);padding-top:18px;display:flex;justify-content:space-between;align-items:center;gap:12px">
    <span class="small muted">${f.follower.active ? 'Updates by ' + (f.follower.channel === 'text' ? 'text' : 'email') + ' · code ' + esc(f.follower.code) : 'You’ve stopped following. Nothing more will be sent.'}</span>
    ${f.follower.active ? '<button class="btn text small" data-act="unfollow">Stop following</button>' : '<button class="btn text small" data-act="follow">Follow again</button>'}</div></div></div></div>`;
}
function followersBlock() {
  const fs = L().followers.filter(f => f.active);
  if (!fs.length) return '';
  return `<div style="margin-top:44px"><h2 class="serif" style="font-size:26px;margin:0 0 4px">Following this home · ${fs.length}</h2><p class="small muted" style="margin:0 0 14px">Each is told automatically about price, open houses and status. Warm buyers — worth a personal call.</p>
  <div class="list">${fs.slice(0, 5).map(f => `<div><span aria-hidden="true">♡</span><span>${esc(f.name || 'A buyer')} <span class="muted small">· ${f.channel}${f.consent ? '' : ' · no consent, not messaged'}</span></span><span class="when">${ago(f.at)}</span></div>`).join('')}</div></div>`;
}

/* ============================================================
   CLOSING BOOK (seller keepsake) · HOME BOOK (new owners)
   ============================================================ */
const fmtDay = t => new Date(t).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
function bookShell(kind, inner) {
  const staff = isStaff();
  return `<div class="book"><div class="bookbar noprint"><span class="mark">${kind}</span><span class="row" style="gap:8px">${staff ? '<a class="btn text small" href="#desk-kit">The Desk</a>' : ''}<button class="btn ghost small" data-act="print">Save as PDF</button></span></div>${inner}
  <footer class="bookfoot"><div class="brands"><span class="b1">${esc(T().name.toUpperCase())}</span><span class="sep"></span><span class="b2">${esc(T().affiliation)}</span></div><div class="small">${esc(T().agent.name)} · ${esc(T().disclaimer)}</div></footer></div>`;
}
function closingBook() {
  const l = L(), staff = isStaff();
  if (!staff && !sellerData()) return sellerGate('closing-book');
  const listed = l.history.filter(h => h.to === 'active')[0], pend = l.history.filter(h => h.to === 'under_contract').slice(-1)[0], closed = l.history.filter(h => h.to === 'closed').slice(-1)[0];
  const dom = listed ? Math.max(1, Math.ceil(((pend || closed || { at: E.now() }).at - listed.at) / 864e5)) : null;
  const guests = l.openHouses.filter(o => o.status === 'completed').reduce((s, o) => s + o.guests + o.qr, 0);
  const nums = [[l.visits.length, 'visits to its story'], [l.leads.filter(d => d.kind === 'showing').length, 'private tour requests'], [l.scans.length, 'sign scans'], [guests, 'open-house guests'], [l.followers.length, 'buyers following it'], [l.visits.filter(v => v.source === 'seller-share').length, 'visits from your shared link']];
  const tl = [listed && [listed.at, 'Introduced to the world', 'Live on NWMLS, story published, the agent network told.']]
    .concat(l.openHouses.filter(o => o.status === 'completed').map(o => [o.completed, 'Open house', o.guests + o.qr + ' groups came through.']))
    .concat(pend ? [[pend.at, 'Under contract', 'An offer you accepted.']] : [])
    .concat(l.contract ? l.contract.milestones.map(m => [m.at, m.label, '']) : [])
    .concat(closed ? [[closed.at, 'Closed', 'The keys change hands.']] : []).filter(Boolean).sort((a, b) => a[0] - b[0]);
  const note = l.closingNote || `It was a privilege to introduce ${street()} to the people who will live its next chapter. Thank you for trusting us with it.`;
  const preview = ['under_contract', 'closed'].indexOf(l.state) < 0;
  return bookShell('CLOSING BOOK', `${preview ? `<div class="banner noprint" style="text-align:center">Preview — your seller sees this once the home is under contract. It fills in as the sale unfolds.</div>` : ''}
  <section class="bcover">${img('front-dusk', '', 'loading="eager"')}<div class="scrim"></div><div class="c"><div class="eyebrow" style="color:#D9C2A0">The story of a sale</div><h1>${esc(street())}</h1><p>${esc(V('community'))} · Bonney Lake, Washington${closed ? ' · ' + fmtDay(closed.at) : ''}</p></div></section>
  <section class="bsec narrow"><div class="eyebrow">A note from ${esc(T().agent.name.split(' ')[0])}</div>
    ${staff && ui.editing === 'closing-note' ? `<form data-form="book-note" data-k="closingNote" class="noprint"><div class="field"><textarea name="text" rows="5">${esc(note)}</textarea></div><button class="btn">Save note</button></form>`
    : `<p class="serif bnote">${esc(note)}</p><p class="small muted">— ${esc(T().agent.name)}</p>${staff ? '<button class="btn text small noprint" data-act="edit" data-v="closing-note">Edit note</button>' : ''}`}</section>
  <section class="bsec narrow"><div class="eyebrow">By the numbers</div><div class="bnums">${nums.map(([v, k]) => `<div><div class="v">${Number(v).toLocaleString()}</div><div class="k">${k}</div></div>`).join('')}${dom ? `<div><div class="v">${dom}</div><div class="k">days from launch to contract</div></div>` : ''}</div>
    <p class="small muted">Counted by your own listing’s site and signs. Zillow and Redfin views aren’t included — there’s no legitimate feed, so we never estimate them.</p></section>
  <section class="bsec narrow"><div class="eyebrow">How it unfolded</div><div class="btl">${tl.length ? tl.map(([at, t, d]) => `<div><span class="d">${new Date(at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span><span><b>${esc(t)}</b>${d ? ' — ' + esc(d) : ''}</span></div>`).join('') : '<div class="muted">The timeline fills in as the sale unfolds.</div>'}</div></section>
  <section class="bsec wrap"><div class="eyebrow" style="text-align:center">The rooms you made home</div><div class="bphotos">${['great-room', 'kitchen-island', 'primary-bed2', 'deck-fire', 'mtn-alpenglow', 'greenbelt-yard'].map(id => img(id, '')).join('')}</div></section>
  <section class="bsec narrow" style="text-align:center"><div class="eyebrow">Your next chapter</div><p class="serif bnote">Wherever you land, we’ll check in once a year with what your old neighborhood is doing — and we’re here whenever you need us.</p></section>`);
}
const CARE = [
  ['Fall', ['Clean gutters and downspouts once the leaves drop', 'Service the furnace or heat pump; replace the filter', 'Blow out irrigation and shut off exterior hose bibs before the first freeze', 'Test smoke and carbon-monoxide detectors']],
  ['Winter', ['Watch for moss on the roof and treat it before it spreads', 'Keep the composite deck clear of leaves so it dries between rains', 'Check crawlspace or garage for moisture after big storms', 'Run the fireplace check: glass, pilot, and an annual service']],
  ['Spring', ['Wash the deck and siding; check caulking around windows', 'Service the central AC before the first warm week', 'Check the fence line along the greenbelt after winter wind', 'Restart irrigation and look for leaks']],
  ['Summer', ['Replace HVAC filters again during heavy-use months', 'Inspect the roof and gutters from the ground for damage', 'Clean the fire-pit burner and check its gas connection', 'Trim plantings back from siding and the AC unit']]
];
function homeBook() {
  const l = L(), staff = isStaff();
  if (!staff && !session.book) return `<div class="private"><div class="phone pad" style="padding-top:90px;padding-bottom:90px"><div class="eyebrow">Home book</div><h1 class="serif" style="font-size:34px">Welcome home.</h1><p class="muted">Open the personal link you received at closing, or enter its code.</p>
    <form data-form="book-login"><div class="field"><label for="bk">Your code</label><input id="bk" name="code" placeholder="HOME-XXXXX" autocapitalize="characters" required></div><button class="btn wide">Open my home book</button></form>${ui.bookError ? '<p class="small" style="color:var(--warn)">That code didn’t match.</p>' : ''}</div></div>`;
  const p = PLACES.tehaleh, facts = ['great_room', 'kitchen', 'main_floor', 'primary', 'fourth_bedroom', 'upper', 'deck', 'storage', 'lot', 'systems', 'garage', 'school_district'].map(k => E.fact(l, k)).filter(f => f && f.status === 'verified');
  const note = l.homeBookNote || `Welcome home. Everything we learned about ${street()} while we had the privilege of selling it is here — the details, the care, and the places nearby worth knowing. Keep it, and call any time.`;
  const favs = l.favorites || [];
  const first = ['Change the garage and door codes, and rekey the locks', 'Find the main water shut-off and the electrical panel, and label both', 'Move utilities and internet into your name (the sellers can share their providers)', 'Update your mailing address with USPS and your bank', 'Register appliance warranties and keep receipts in one folder', 'Check the Pierce County Assessor-Treasurer site for your property-tax schedule'];
  const preview = l.state !== 'closed';
  return bookShell('HOME BOOK', `${preview && staff ? `<div class="banner noprint" style="text-align:center">Preview — the new owners get this at closing with a private link${l.homeBook ? ' (' + esc(l.homeBook.code) + ')' : ''}, after you approve it.</div>` : ''}
  <section class="bcover">${img('great-room', '', 'loading="eager"')}<div class="scrim"></div><div class="c"><div class="eyebrow" style="color:#D9C2A0">Your home book</div><h1>Welcome to ${esc(street())}</h1><p>${esc(V('community'))} · Bonney Lake, Washington</p></div></section>
  <section class="bsec narrow"><div class="eyebrow">From ${esc(T().agent.name.split(' ')[0])}</div>
    ${staff && ui.editing === 'home-note' ? `<form data-form="book-note" data-k="homeBookNote" class="noprint"><div class="field"><textarea name="text" rows="5">${esc(note)}</textarea></div><button class="btn">Save note</button></form>`
    : `<p class="serif bnote">${esc(note)}</p>${staff ? '<button class="btn text small noprint" data-act="edit" data-v="home-note">Edit note</button>' : ''}`}</section>
  <section class="bsec narrow"><div class="eyebrow">Your home at a glance</div><div class="bfacts">${facts.map(f => `<div><div class="k">${esc(f.label)}</div><div>${esc(f.value)}</div></div>`).join('')}</div>
    <p class="small muted">From the verified listing record. Confirm details against your inspection report and disclosures.</p></section>
  <section class="bsec narrow"><div class="eyebrow">Your first week</div><div class="list">${first.map(x => `<div><span aria-hidden="true">○</span><span>${esc(x)}</span></div>`).join('')}</div></section>
  <section class="bsec narrow"><div class="eyebrow">Caring for it, season by season</div><p class="small muted" style="margin-top:-4px">Written for Puget Sound weather and this home’s deck, fire pit, AC and greenbelt yard.</p>
    <div class="bcare">${CARE.map(([s, xs]) => `<div><h3 class="serif">${s}</h3><ul>${xs.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div></section>
  <section class="bsec narrow"><div class="eyebrow">${esc(T().agent.name.split(' ')[0])}’s local picks</div>
    ${favs.length ? `<div class="placelist">${favs.map((f, i) => `<div><h3 class="serif">${esc(f.name)} <span class="small muted">· ${esc(f.cat)}</span></h3><p>${esc(f.why)}</p>${staff ? `<button class="btn text small noprint" data-act="fav-del" data-i="${i}">Remove</button>` : ''}</div>`).join('')}</div>` : `<p class="muted">${staff ? 'Add the places you actually send clients — your coffee spot, the hardware store, the pizza on moving night. They appear in every home book in Tehaleh.' : 'Coming soon.'}</p>`}
    ${staff ? `<form data-form="fav" class="noprint favform"><input name="name" placeholder="Place" required aria-label="Place name"><input name="cat" placeholder="Category (coffee, dinner…)" required aria-label="Category"><input name="why" placeholder="Why you love it" required aria-label="Why"><button class="btn">Add pick</button></form>` : ''}</section>
  <section class="bsec narrow"><div class="eyebrow">Life in ${esc(p.name)}</div>${p.chapters.map(sec => `<h3 class="serif" style="font-size:22px;margin:26px 0 8px">${esc(sec.t)}</h3><div class="placelist">${(sec.items || []).map(([n, d, s]) => `<div><h3 class="serif" style="font-size:18px">${esc(n)}</h3><p>${esc(d)}</p>${srcLink(s)}</div>`).join('')}${sec.grid ? `<div><p>${sec.grid.map(g => esc(g[0]) + ' (ages ' + esc(g[1]) + ')').join(' · ')}</p>${srcLink(sec.src)}</div>` : ''}</div>`).join('')}
    <p class="small muted" style="margin-top:20px">${esc(p.fine)} Sources re-checked ${fmtDay(placeChecked('tehaleh'))}.</p></section>
  <section class="bsec narrow"><div class="eyebrow">People we trust</div><p>Painters, landscapers, organizers, designers — introductions only with your permission.</p><a class="btn ghost noprint" href="#home-edit">Ask for an introduction</a>
    <div class="eyebrow" style="margin-top:40px">Every year</div><p>A note on your home’s anniversary with what homes like yours are selling for — no automated estimate, just real sales. Any time sooner: <a href="#valuation">ask for a private valuation</a>.</p></section>`);
}
function placeChecked(k) { const d = DB.placeChecks && DB.placeChecks[k]; return d || new Date(PLACES[k].checked + 'T12:00:00').getTime(); }

/* ============================================================
   SILENT TALKERS (print)
   ============================================================ */
function talkerQR(id) {
  const url = shareUrl('t-' + id.toLowerCase());
  if (typeof qrcode !== 'function') return '';
  const q = qrcode(0, 'M'); q.addData(url); q.make(); return q.createSvgTag({ cellSize: 3, margin: 0, scalable: true });
}
function talkersView() {
  const cards = E.talkers(LID), style = ui.talkerStyle || 'tent';
  const on = cards.filter(c => !c.held && !c.off), held = cards.filter(c => c.held);
  const scans = (L().talkerScans || []).reduce((m, s) => (m[s.id] = (m[s.id] || 0) + 1, m), {});
  const card = c => `<article class="talker t-${style}">${style === 'easel' ? `<div class="tph">${img(c.photo, '')}</div>` : ''}<div class="tin"><div class="eyebrow">${esc(c.room)}</div><h2 class="serif">${esc(c.title)}</h2><p>${esc(c.body)}</p>
    <div class="tfoot"><div class="tbrand"><span class="b1">${esc(T().name.toUpperCase())}</span><span class="small">${esc(T().affiliation)}</span></div>${style !== 'minimal' ? `<div class="tqr"><div class="code">${talkerQR(c.id)}</div><span class="small">See the full story</span></div>` : ''}</div></div></article>`;
  return deskShell('desk-kit', `<div class="noprint" style="padding:28px 0 8px"><a href="#desk-kit" class="small">← Print &amp; present</a>
    <h2 class="serif" style="font-size:34px;margin:10px 0 6px">Silent talkers</h2><p class="muted" style="margin:0 0 18px;max-width:64ch">Room cards for showings and open houses. Written only from verified facts — correct a fact once and every card reprints right. Each QR opens that part of the story and counts the scan.</p>
    <div class="quiet" style="border-top:none;padding-top:0"><span class="seg" role="group" aria-label="Card style">${[['tent', 'Tent card'], ['easel', 'Easel with photo'], ['minimal', 'Minimal']].map(([k, n]) => `<button data-act="talker-style" data-v="${k}" aria-pressed="${style === k}">${n}</button>`).join('')}</span><button class="btn" data-act="print">Print ${on.length} cards</button></div>
    <div class="rules" style="margin-top:20px">${cards.filter(c => !c.held).map(c => `<div class="rulerow"><div><div>${esc(c.room)} — ${esc(c.title)}${c.custom ? ' <span class="tag mute">yours</span>' : ''}</div><div class="small muted" style="margin-top:4px">From: ${esc(c.sources.join(' · '))}${scans[c.id] ? ' · scanned ' + scans[c.id] + '×' : ''}</div></div><span class="seg"><button data-act="talker-toggle" data-v="${c.id}" aria-pressed="${!c.off}">Include</button></span></div>`).join('')}
    ${held.map(c => `<div class="rulerow"><div><div class="muted">${esc(c.room)}</div><div class="small muted" style="margin-top:4px">${esc(c.why)}</div></div><span class="tag warn">Held</span></div>`).join('')}</div>
    <form data-form="talker" class="favform" style="margin-top:18px"><input name="room" placeholder="Room" required aria-label="Room"><input name="title" placeholder="Headline" required aria-label="Headline"><input name="body" placeholder="One or two sentences" required aria-label="Card text"><button class="btn">Add a card</button></form>
    <p class="small muted">Your own cards are checked against removed claims before they print.</p></div>
  <div class="talkers">${on.map(card).join('')}</div>`);
}

/* ============================================================
   PRINT & PRESENT hub, QUICK SETUP, PRESENTATION
   ============================================================ */
function deskKit() {
  const ls = E.listings();
  const tile = (h, t, d) => `<a class="card" href="#${h}"><span class="t">${t}</span><span class="muted">${d}</span></a>`;
  return deskShell('desk-kit', `<div style="padding:34px 0 90px"><p class="say" style="margin-top:0">Everything you hand someone, made from the same verified facts.</p>
  <div class="kitgrid">${tile('present', 'Listing presentation', 'Win the listing at the kitchen table — live proof from this home.')}${tile('quick', 'Set up a new listing', 'About ten minutes. The Concierge does the rest.')}
    ${tile('talkers', 'Silent talkers', 'Room cards for showings, each with its own QR.')}${tile('sign', 'Open-house sign', 'Permanent sign IDs that follow the home.')}
    ${tile('closing-book', 'Closing book', 'The seller’s keepsake of their sale.')}${tile('home-book', 'Home book', 'For the new owners: the home, its care and the area.')}</div>
  <h2 class="serif" style="font-size:26px;margin:56px 0 12px">Your listings</h2><div class="list">${ls.map(x => { const st = x.facts.filter(f => f.status === 'pending' || f.status === 'conflict').length, adr = (x.facts.find(f => f.key === 'address') || {}).value || x.id;
    return `<div><span aria-hidden="true">${x.id === LID ? '●' : '○'}</span><span>${esc(String(adr).split(',')[0])} <span class="small muted">· ${esc(LC.STATES[x.state])}${x.id === LID ? ' · open on The Desk' : (st ? ' · ' + st + ' fact' + (st > 1 ? 's' : '') + ' to confirm' : '') + (x.checklist && !x.checklist.photos ? ' · waiting on photos' : '') + ' · seller code ' + esc(x.sellers[0].code)}</span></span><span class="when">${ago(x.created || (x.history[0] || {}).at)}</span></div>`; }).join('')}</div></div>`);
}
function quickSetup() {
  if (ui.created) { const x = ui.created;
    return deskShell('desk-kit', `<div class="narrow" style="padding:40px 0 90px"><div class="eyebrow">Set up</div><p class="say" style="margin-top:8px">${esc(String(x.facts[0].value).split(',')[0])} is ready to prepare.</p>
    <div class="list">${[['Facts entered and verified by you', true], ['Square footage waits for a county or builder record', !x.facts.some(f => f.key === 'sqft')], ['Photos', x.checklist.photos], ['Seller invited · code ' + x.sellers[0].code, !!x.checklist.seller], ['Goes public only after a verified NWMLS status and your go-live', false]].map(([t, ok]) => `<div><span style="color:${ok ? 'var(--ok)' : 'var(--accent)'}" aria-hidden="true">${ok ? '✓' : '○'}</span><span>${esc(t)}</span></div>`).join('')}</div>
    <p class="muted">From here the Concierge drafts the story, social posts, agent email and silent talkers from these facts, and asks you only about what it can’t verify.</p><div class="acts" style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" data-act="quick-again">Set up another</button><a class="btn ghost" href="#desk-kit">Your listings</a></div></div>`); }
  const s = ui.qs || 1, steps = ['The home', 'Photos', 'Your seller', 'The look'];
  return deskShell('desk-kit', `<div class="narrow" style="padding:34px 0 90px"><p class="say" style="margin-top:0">A new listing in about ten minutes.</p>
  <div class="qsteps">${steps.map((n, i) => `<span class="${i + 1 === s ? 'c' : i + 1 < s ? 'd' : ''}">${i + 1} · ${n}</span>`).join('')}</div>
  <form data-form="quick" class="setupform" data-step="${s}">
  <fieldset ${s === 1 ? '' : 'hidden'}><div class="field"><label for="q-a">Address</label><input id="q-a" name="address" autocomplete="street-address" ${s === 1 ? 'required' : ''} value="${esc(ui.q.address || '')}"></div>
    <div class="qgrid"><div class="field"><label for="q-p">List price</label><input id="q-p" name="price" inputmode="numeric" value="${esc(ui.q.price || '')}"></div><div class="field"><label for="q-b">Bedrooms</label><input id="q-b" name="beds" inputmode="numeric" value="${esc(ui.q.beds || '')}"></div>
    <div class="field"><label for="q-ba">Baths</label><input id="q-ba" name="baths" inputmode="decimal" value="${esc(ui.q.baths || '')}"></div><div class="field"><label for="q-s">Square feet (optional)</label><input id="q-s" name="sqft" inputmode="numeric" value="${esc(ui.q.sqft || '')}"></div></div>
    <div class="field"><label for="q-h">What makes it special? (a few lines)</label><textarea id="q-h" name="highlights" rows="3" placeholder="Remodeled kitchen, west-facing deck, walk to the water">${esc(ui.q.highlights || '')}</textarea></div><p class="small muted">Highlights are held as pending until you confirm each one — nothing unverified publishes.</p></fieldset>
  <fieldset ${s === 2 ? '' : 'hidden'}><div class="field"><label for="q-ph">Google Drive photo folder (link or name)</label><input id="q-ph" name="photos" value="${esc(ui.q.photos || '')}"></div>
    <label class="check"><input type="checkbox" name="photosReady" ${ui.q.photosReady ? 'checked' : ''}> The photographer’s final photos are in the folder</label><p class="small muted">The Concierge sorts them into rooms and chapters and picks a lead photo you can change.</p></fieldset>
  <fieldset ${s === 3 ? '' : 'hidden'}><div class="field"><label for="q-sn">Seller name(s)</label><input id="q-sn" name="seller" value="${esc(ui.q.seller || '')}"></div><div class="field"><label for="q-se">Seller email</label><input id="q-se" name="sellerEmail" type="email" value="${esc(ui.q.sellerEmail || '')}"></div>
    <label class="check"><input type="checkbox" name="launchOk" ${ui.q.launchOk ? 'checked' : ''}> The seller agreed to launch and progress messages</label>
    <div class="field"><label for="q-t">How we write to them</label><select id="q-t" name="tone"><option value="celebratory">Celebratory</option><option value="quiet" ${ui.q.tone === 'quiet' ? 'selected' : ''}>Quiet — for a sensitive move</option></select></div></fieldset>
  <fieldset ${s === 4 ? '' : 'hidden'}><div class="field"><label>Presentation</label></div><div class="chips">${[['heritage', 'Warm Heritage'], ['arch', 'Modern Architectural'], ['editorial', 'Estate Editorial']].map(([k, n]) => `<button type="button" class="chip" data-act="q-mode" data-v="${k}" aria-pressed="${(ui.q.mode || 'editorial') === k}">${n}</button>`).join('')}</div>
    <p class="small muted" style="margin-top:14px">Your rules from Setup apply automatically — no need to choose them again.</p></fieldset>
  <div class="acts" style="display:flex;gap:10px;margin-top:22px">${s > 1 ? '<button type="button" class="btn ghost" data-act="q-back">Back</button>' : ''}<button class="btn">${s < 4 ? 'Continue' : 'Create the listing'}</button></div></form></div>`);
}
function slides() {
  const l = L(), a = E.assets(LID), r = E.report(LID), s = l.saved;
  const allVisits = l.visits.length, req = l.leads.filter(d => d.kind === 'showing').length;
  const qa = E.answer(LID, 'Is there a view of Mount Rainier?') || 'Answered instantly from the verified record.';
  return [
    `<div class="sl sl-photo">${img('front-dusk', 'bg', 'loading="eager"')}<div class="scrim"></div><div class="c"><div class="eyebrow" style="color:#D9C2A0">${esc(T().name)} · ${esc(T().affiliation)}</div><h1>Your home, introduced properly.</h1><p>A private concierge that markets it, reports to you and never gets a fact wrong.</p></div></div>`,
    `<div class="sl sl-split"><div class="ph">${img(l.heroPhoto || 'great-room', '')}</div><div class="c"><div class="eyebrow">01 · The story</div><h2>Every home becomes a story, not a listing.</h2><p>“${esc(a.headline)}”</p><p class="muted">Chapters, the photographer’s best work, and the neighborhood — on a page buyers actually finish.</p></div></div>`,
    `<div class="sl"><div class="c wide"><div class="eyebrow">02 · Launch</div><h2>The moment NWMLS confirms you’re live, everything goes.</h2><div class="sl-steps">${['NWMLS status verified', 'Your story publishes', 'You’re told first', 'Social posts and the agent network', 'A report every Friday'].map((t, i) => `<div><span>${i + 1}</span>${t}</div>`).join('')}</div><p class="muted">Nothing launches on a rumor. Nothing is sent twice.</p></div></div>`,
    `<div class="sl sl-split"><div class="c"><div class="eyebrow">03 · You’ll always know</div><h2>A private portal that tells you what happened — before you ask.</h2><p class="muted">Updates, open-house recaps, showing feedback without names, and your path to closing.</p></div><div class="phonemock"><div class="pm-top">YOUR CONCIERGE</div><div class="pm-h serif">Your home’s journey</div><div class="pm-l"><div class="eyebrow">Latest</div><p class="serif">${esc((l.updates[0] && l.updates[0].text) || 'Your home is officially live. Its story is ready to share.')}</p></div></div></div>`,
    `<div class="sl"><div class="c"><div class="eyebrow">04 · Buyers</div><h2>Questions answered in seconds. Judgment calls come to us.</h2><div class="sl-qa"><p class="q">“Is there a view of Mount Rainier?”</p><p class="serif">${esc(qa)}</p></div><p class="muted">Tour requests get an instant reply and a personal call. Buyers can follow the home and hear about every change.</p></div></div>`,
    `<div class="sl sl-dark"><div class="c wide"><div class="eyebrow" style="color:#D9C2A0">05 · Proof, from ${esc(street())}</div><h2>${allVisits ? 'Real numbers, from a real listing.' : 'Day one — every number starts here.'}</h2><div class="bnums light">${[[allVisits, 'story visits'], [req, 'tour requests'], [l.scans.length, 'sign scans'], [l.followers.filter(f => f.active).length, 'buyers following'], [Math.round(s.minutes / 6) / 10, 'agent hours given back']].map(([v, k]) => `<div><div class="v">${v}</div><div class="k">${k}</div></div>`).join('')}</div><p style="color:#B9B2A6">Counted, never estimated. Zillow and Redfin are shown as unavailable rather than guessed.</p></div></div>`,
    `<div class="sl"><div class="c wide"><div class="eyebrow">06 · Protected</div><h2>Rules that can’t be switched off.</h2><div class="sl-locks">${['Your price never changes without you', 'Nothing launches without a verified status and your OK', 'Offers and strategy always come to a person', 'Follow-ups only to people who agreed', 'Unverified claims never publish'].map(t => `<div>${t}</div>`).join('')}</div></div></div>`,
    `<div class="sl sl-split"><div class="ph">${img('primary-bed2', '')}</div><div class="c"><div class="eyebrow">07 · After the sale</div><h2>A closing book for you. A home book for them.</h2><p class="muted">The story of your sale, kept. And for the new owners, the home’s details, its care and the places nearby worth knowing.</p></div></div>`,
    `<div class="sl sl-photo">${img('deck-fire', 'bg')}<div class="scrim"></div><div class="c"><div class="eyebrow" style="color:#D9C2A0">Let’s begin</div><h1>Ten minutes today. We take it from there.</h1><div class="noprint" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:28px"><a class="btn light" href="#quick">Set up your listing</a><a class="btn line" href="#story">See a live story</a></div><p style="margin-top:28px">${esc(T().agent.name)} · ${esc(T().name)}</p></div></div>`
  ];
}
function present() {
  const all = slides(), i = Math.max(0, Math.min(all.length - 1, ui.slide || 0));
  return `<div class="deck" data-act="slide-tap"><div class="slide">${all[i].replace(/data-act="zoom"/g, "")}</div>
  <div class="dctl"><button data-act="slide" data-d="-1" aria-label="Previous slide" ${i === 0 ? 'disabled' : ''}>←</button><span>${i + 1} / ${all.length}</span><button data-act="slide" data-d="1" aria-label="Next slide" ${i === all.length - 1 ? 'disabled' : ''}>→</button><a href="#desk-kit" aria-label="Exit presentation">Exit</a></div></div>`;
}
document.addEventListener('keydown', e => {
  if (route() !== 'present') return;
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); ui.slide = Math.min(slides().length - 1, (ui.slide || 0) + 1); render(); }
  if (e.key === 'ArrowLeft') { ui.slide = Math.max(0, (ui.slide || 0) - 1); render(); }
  if (e.key === 'Escape') location.hash = 'desk-kit';
});
Object.assign(A, {
  follow: () => followSheet(),
  unfollow: () => { E.emit(LID, 'follow.stopped', { code: session.follower }); toast('Stopped. Nothing more will be sent.'); },
  'follow-out': () => { session.follower = null; keepSession(); location.hash = 'story'; },
  print: () => window.print(),
  'fav-del': el => { L().favorites.splice(el.dataset.i * 1, 1); dirty = true; scheduleSave(); render(); },
  'talker-style': el => { ui.talkerStyle = el.dataset.v; render(); },
  'talker-toggle': el => E.toggleTalker(LID, el.dataset.v),
  'q-mode': el => { ui.q.mode = el.dataset.v; el.parentNode.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === el)); },
  'q-back': () => { keepQuick(document.querySelector('[data-form=quick]')); ui.qs = Math.max(1, (ui.qs || 1) - 1); render(); },
  'quick-again': () => { ui.created = null; ui.q = {}; ui.qs = 1; render(); },
  slide: (el, e) => { e.stopPropagation(); ui.slide = Math.max(0, Math.min(slides().length - 1, (ui.slide || 0) + Number(el.dataset.d))); render(); },
  'slide-tap': (el, e) => { if (e.target.closest('a,button')) return; const n = slides().length; ui.slide = e.clientX > innerWidth * 0.35 ? Math.min(n - 1, (ui.slide || 0) + 1) : Math.max(0, (ui.slide || 0) - 1); render(); },
  'recheck-ok': el => { DB.placeChecks = DB.placeChecks || {}; DB.placeChecks.tehaleh = E.now(); E.resolve(LID, el.dataset.id, 'Sources re-checked by ' + T().agent.name); toast('Re-checked. The guide and home books show today’s date.'); }
});
ui.q = ui.q || {};
function keepQuick(f) { if (!f) return; ['address', 'price', 'beds', 'baths', 'sqft', 'highlights', 'photos', 'seller', 'sellerEmail', 'tone'].forEach(k => { if (f.elements[k]) ui.q[k] = f.elements[k].value; }); ['photosReady', 'launchOk'].forEach(k => { if (f.elements[k]) ui.q[k] = f.elements[k].checked; }); }
Object.assign(FORMS, { 'tc-ci': () => { }, 'tc-fix': async f => { const k = f.dataset.k, r = (ui.tcRows || []).find(x => tcKey(x) === k), t = f.elements.note.value.trim(); if (!r || !t) return;
    ui.tcCalls = Object.assign({}, ui.tcCalls, { [k]: 'Change it' }); ui.tcFix = null; render(); await liveAppend("'TC feedback'", [liveNow(), r[1], k, 'Change it', t], 'Saved. Your TC reads this on its next run.'); } });
Object.assign(FORMS, { 'tc-edit': f => { const b = f.querySelector('[type=submit]'); if (b) { b.disabled = true; b.textContent = 'Saving…'; } tcSaveDesk(f.dataset.k, f.subject.value, f.body.value); } });
Object.assign(FORMS, {
  follow: async f => { const c = readContact(f); if (!c) return; if (!(await submitLead(f, 'follow', c))) return; const r = E.emit(LID, 'follow.created', { name: c.name, contact: c.email, consent: true, source: session.attribution || 'story' });
    if (!r.follower) return toast('Enter a mobile number or email.'); session.follower = r.follower.code; keepSession();
    sheet(`<div class="eyebrow">You’re following</div><h3>${r.existing ? 'Welcome back.' : 'Done. We’ll tell you the moment anything changes.'}</h3>${SITE ? `<p class="muted">We’ll email ${esc(c.email)} the moment the price, an open house or the status changes. Reply STOP any time.</p><button class="btn wide" data-act="close">Back to the home</button>` : `<p class="muted">Your personal link is your sign-in — no password. Code <b>${esc(r.follower.code)}</b>.</p><a class="btn wide" href="#following">Open my homes</a>`}`); },
  'follow-login': f => { try { E.followerView(LID, f.code.value.trim()); session.follower = f.code.value.trim().toUpperCase(); ui.followError = false; keepSession(); } catch (e) { ui.followError = true; } render(); },
  'book-login': f => { try { E.homeBook(LID, f.code.value.trim()); session.book = f.code.value.trim().toUpperCase(); ui.bookError = false; keepSession(); } catch (e) { ui.bookError = true; } render(); },
  'book-note': f => { L()[f.dataset.k] = f.elements.text.value.trim(); ui.editing = null; dirty = true; scheduleSave(); render(); toast('Saved.'); },
  fav: f => { L().favorites.push({ name: f.elements.name.value.trim(), cat: f.cat.value.trim(), why: f.why.value.trim() }); dirty = true; scheduleSave(); render(); },
  talker: f => { const r = E.addTalker(LID, { room: f.room.value, title: f.title.value, body: f.body.value }); toast(r.ok ? 'Card added.' : 'Not added — it repeats a removed claim (' + r.blocked.join(', ') + ').'); },
  quick: f => { keepQuick(f); const s = ui.qs || 1;
    if (s < 4) { ui.qs = s + 1; render(); return; }
    ui.created = E.createListing(Object.assign({}, ui.q, { mode: ui.q.mode || 'editorial' })); ui.qs = 1; render(); toast('Listing set up.'); }
});

/* ============================================================
   LIVE — the public site's Google Sheet, read and written on The Desk
   ============================================================ */
const LC_LISTED = 1795132800000;
const LIVE_SHEET = '1ROkc-18VbSn7kkLZYrTyJYiooMDLbBxYR0SSWItll2E';
const PORTAL_URL = 'https://homes.ranchpnw.com/sellers';
const PORTAL_CODE = 'AH-QCRU9E';
const MARKETING_PRESETS = [
  ['Agent network email — all 10 offices', '~600 agents'],
  ['Local agent calls', ''],
  ['Social post', ''],
  ['Open house', ''],
  ['Broker preview', ''],
  ['Mailers / door hangers', ''],
  ['Other', '']
];
const liveRows = p => (p && p.values) || [];
async function liveLoad(quiet) {
  if (!caps.mcp || ui.liveBusy) return;
  ui.liveBusy = true; if (!quiet) render();
  try {
    const [leads, mk] = await Promise.all([
      callTool('Google Sheets', 'get_values', { spreadsheetId: LIVE_SHEET, range: 'Leads!A2:J500' }),
      callTool('Google Sheets', 'get_values', { spreadsheetId: LIVE_SHEET, range: 'Marketing!A2:E200' }).catch(() => null),
      callTool('Google Sheets', 'get_values', { spreadsheetId: LIVE_SHEET, range: "'Open houses'!A2:G200" }).catch(() => null),
      callTool('Google Sheets', 'get_values', { spreadsheetId: LIVE_SHEET, range: "'Showing agents'!A2:J500" }).catch(() => null),
      callTool('Google Sheets', 'get_values', { spreadsheetId: LIVE_SHEET, range: "'Photo layout'!A2:F500" }).catch(() => null),
      callTool('Google Sheets', 'get_values', { spreadsheetId: LIVE_SHEET, range: "'Hub done'!B2:B3000" }).catch(() => null),
      callTool('Google Sheets', 'get_values', { spreadsheetId: LIVE_SHEET, range: 'Offers!A2:Q300' }).catch(() => null),
      callTool('Google Sheets', 'get_values', { spreadsheetId: LIVE_SHEET, range: "'TC shadow'!A2:L2000" }).catch(() => null),
      callTool('Google Sheets', 'get_values', { spreadsheetId: LIVE_SHEET, range: "'TC feedback'!A2:E2000" }).catch(() => null),
      callTool('Google Sheets', 'get_values', { spreadsheetId: LIVE_SHEET, range: 'Listings!A1:K60' }).catch(() => null)
    ]).then(r => { ui.offerRows = liveRows(r[6]); ui.listRows = liveRows(r[9]); ui.tcRows = liveRows(r[7]); ui.tcCalls = {}; liveRows(r[8]).forEach(x => { if (x[2] && !/^edited$/i.test(x[3] || '')) ui.tcCalls[x[2]] = x[3]; }); ui.ohRows = liveRows(r[2]); ui.showRows = liveRows(r[3]); ui.fbOk = Object.assign({}, ui.fbOk); liveRows(r[5]).forEach(x => { if (/^fb:/.test(x[0])) ui.fbOk[String(x[0]).slice(3)] = 1; }); try { applyOpenHouses(ui.ohRows); } catch (e) {}
      try { const lr = liveRows(r[4]).filter(x => String(x[1]) === '19917'); const last = lr[lr.length - 1]; if (last && !ui.photoDraft) { const j = v => { try { return JSON.parse(v || '[]'); } catch (e) { return []; } }; applyLayout({ order: j(last[2]), hidden: j(last[3]), featured: j(last[4]) }); ui.layoutSaved = last[0]; } } catch (e) {}
      return r; });
    ui.live = { at: Date.now(), leads: liveRows(leads).filter(r => r[8] !== 'test').reverse(), marketing: liveRows(mk).reverse() };
  } catch (e) { ui.live = { at: Date.now(), error: (e && e.message) || 'Couldn’t reach the Sheet.' }; }
  ui.liveBusy = false; render();
}
async function liveAppend(tab, row, done) {
  try { await callTool('Google Sheets', 'append_values', { spreadsheetId: LIVE_SHEET, range: tab + '!A1', values: [row] }); toast(done); liveLoad(true); return true; }
  catch (e) { toast('Not saved — ' + ((e && e.message) || 'the Sheet didn’t respond') + '.'); return false; }
}
const liveNow = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };

/* ---------- share bar: the one public link, always at the top of the Desk ---------- */
const PUBLIC_PAGE = 'https://homes.ranchpnw.com/19917';
const SHARE_TEXT = 'Just listed in Tehaleh: 19917 145th St E, Bonney Lake. Five bedrooms, Mount Rainier views and a backyard on the greenbelt. Offered at $775,000.';
function shareBar() {
  if (!isStaff()) return '';
  return `<div class="sharebar"><div class="eyebrow">Share this listing</div>
    <div class="shareurl"><span>${PUBLIC_PAGE.replace('https://', '')}</span><button class="btn" data-act="share-listing">Share</button></div>
    <div class="chips" style="margin:12px 0 0"><button class="chip" data-act="share-copy">Copy link</button><button class="chip" data-act="share-copy-post">Copy link + caption</button><a class="chip" href="${PUBLIC_PAGE}" target="_blank" rel="noopener">Open page</a><a class="chip" href="https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(PUBLIC_PAGE)}" target="_blank" rel="noopener">Refresh Facebook preview</a></div>
    <div class="small muted" style="margin-top:10px">This is the public page buyers and agents see. The Desk link stays private to you.</div></div>`;
}

/* ---------- open houses: add from the Desk, publishes to the listing page within a minute ---------- */
const OH_TIMES = (() => { const out = []; for (let h = 8; h <= 20; h++) for (const m of [0, 30]) out.push([String(h).padStart(2, '0') + String(m).padStart(2, '0'), ohClock(h, m, true)]); return out; })();
/* ---------- listing photos: order, feature, hide. Nothing is deleted; hidden photos can come back any time. ---------- */
function photoDraft() { if (!ui.photoDraft) { const hid = new Set(LAYOUT.hidden); ui.photoDraft = { list: LC.MEDIA.map(m => m.id).concat(ALL_MEDIA.filter(m => hid.has(m.id)).map(m => m.id)), hidden: LAYOUT.hidden.slice(), featured: FEATURED.slice() }; } return ui.photoDraft; }
function photoBlock() {
  if (!isStaff()) return '';
  if (!ui.photoOpen) return `<div class="sharebar" id="photos-edit"><div class="eyebrow">Listing photos</div><p class="small muted" style="margin:8px 0 12px">${LC.MEDIA.length} photos on the page · ${FEATURED.length} in the top grid${ui.layoutSaved ? ' · last arranged ' + esc(ui.layoutSaved) : ''}</p><button class="btn ghost" data-act="photo-open">Arrange photos</button></div>`;
  const d = photoDraft(), hid = new Set(d.hidden), fe = d.featured;
  const tile = (id, i) => { const m = M(id); if (!m) return ''; const f = fe.indexOf(id);
    return `<div class="ptile${hid.has(id) ? ' off' : ''}"><img src="${esc(m.thumb)}" alt="${esc(m.alt)}" loading="lazy"><div class="pt-n">${hid.has(id) ? 'Hidden' : f >= 0 ? '★ ' + (f + 1) : i + 1}</div><div class="pt-r">${esc(m.room)}</div>
      <div class="pt-a"><button data-act="photo-mv" data-id="${id}" data-d="-1" aria-label="Move earlier">↑</button><button data-act="photo-mv" data-id="${id}" data-d="1" aria-label="Move later">↓</button><button data-act="photo-top" data-id="${id}" aria-label="Move to first">⇤</button><button data-act="photo-star" data-id="${id}" aria-pressed="${f >= 0}" aria-label="${f >= 0 ? 'Remove from' : 'Add to'} the top grid">${f >= 0 ? '★' : '☆'}</button><button data-act="photo-hide" data-id="${id}" aria-label="${hid.has(id) ? 'Show' : 'Hide'}">${hid.has(id) ? 'Show' : 'Hide'}</button></div></div>`; };
  return `<div class="sharebar" id="photos-edit"><div class="eyebrow">Arrange listing photos</div>
    <p class="small muted" style="margin:8px 0 14px">↑ ↓ change the order on the page. ★ puts a photo in the top grid (up to 9, in star order). Hide takes it off the page; nothing is deleted, and Show brings it back.</p>
    <div class="ptiles">${d.list.map(tile).join('')}</div>
    <div class="chips" style="margin-top:16px"><button class="btn" data-act="photo-save" ${ui.busy === 'photos' ? 'disabled' : ''}>${ui.busy === 'photos' ? 'Publishing…' : 'Publish to the listing page'}</button><button class="chip" data-act="photo-reset">Back to the original order</button><button class="chip" data-act="photo-close">Cancel</button></div>
    <p class="small muted" style="margin-top:10px">Shows on homes.ranchpnw.com/19917 within a minute.</p></div>`;
}

/* ---------- pending: the deal at the top, the sellers right under it, listing-stage tools sink to the bottom ---------- */
function pendingDeal() { const k = homeKeyJs(street()); return (ui.offerRows || []).filter(r => homeKeyJs(r[1]) === k && /accept|mutual|pending|contract/i.test(r[9] || '')).pop() || null; }
function sellerDates() { const k = homeKeyJs(street()), out = {}; (ui.tcRows || []).filter(r => homeKeyJs(r[1]) === k && /^seller date:/i.test(r[2] || '')).forEach(r => { out[String(r[2]).replace(/^seller date:\s*/i, '')] = { d: r[3], note: r[4] }; }); return out; }
function dealBlock() {
  const o = pendingDeal(); if (!o || !isStaff()) return '';
  const sd = sellerDates(), day = v => /^\d{4}-\d\d-\d\d/.test(v || '') ? new Date(String(v).slice(0, 10) + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '';
  const now = new Date().toISOString().slice(0, 10), rows = Object.entries(sd);
  return `<div class="sharebar" id="deal"><div class="eyebrow">Under contract · closing ${esc(day(o[13]) || o[13] || 'date to come')}</div>
    <p class="small muted" style="margin:6px 0 0">${esc(String(o[2] || '').replace(/\s*\(.*\)/, ''))} · ${esc(o[6] || '')}. Inspection, appraisal and signing stay on watch here as they’re booked.</p>
    ${rows.length ? `<div class="list" style="margin-top:12px">${rows.map(([m, x]) => `<div style="${x.d && String(x.d).slice(0, 10) < now ? 'opacity:.55' : ''}"><span aria-hidden="true">${x.d && String(x.d).slice(0, 10) < now ? '✓' : '●'}</span><span><b>${esc(m)}</b>${x.note ? `<br><span class="small muted">${esc(String(x.note).slice(0, 120))}</span>` : ''}</span><span class="when">${esc(day(x.d) || 'to come')}</span></div>`).join('')}</div>` : '<p class="small muted" style="margin-top:10px">Contract dates appear here once your TC reads the signed agreement.</p>'}</div>`;
}
function sellerBlock() {
  if (!isStaff()) return '';
  return `<div style="margin-top:28px">
  <div class="decision" style="margin-top:28px"><div class="eyebrow">Seller portal · Aaron and Holly</div><div class="t" style="margin-top:6px"><a href="${PORTAL_URL}" target="_blank" rel="noopener">${PORTAL_URL.replace('https://', '')}</a> · code <b>${PORTAL_CODE}</b></div><div class="d">${pendingDeal() ? 'They see the road to closing, their key dates and your updates.' : 'They see live visits, shares, scans, tour and follow counts (never names), your updates, the marketing log and showing feedback.'}</div>
    <div class="chips" style="margin-top:12px"><button class="chip" data-act="portal-copy">Copy their invite</button><a class="chip" href="${PORTAL_URL}#code=${PORTAL_CODE}" target="_blank" rel="noopener">Open it as them</a></div></div>
  ${caps.mcp ? `<details style="margin-top:22px"><summary class="btn ghost" style="display:inline-flex">Post an update to the sellers</summary>
    <form data-form="live-update" style="margin-top:16px"><div class="field"><label for="lu-t">Headline</label><input id="lu-t" name="headline" required placeholder="A strong first weekend"></div><div class="field"><label for="lu-m">Message</label><textarea id="lu-m" name="msg" required placeholder="Three showings booked for Saturday…"></textarea></div><button class="btn">Post to their portal</button></form></details>
${pendingDeal() ? `<details style="margin-top:12px"><summary class="btn ghost" style="display:inline-flex">Zillow &amp; Redfin numbers</summary><div style="margin-top:12px">` : ''}  <details style="margin-top:12px"><summary class="btn ghost" style="display:inline-flex">Update Zillow &amp; Redfin numbers</summary>
    <form data-form="live-portal" style="margin-top:16px"><div class="small muted" style="margin-bottom:12px">Copy the views and saves from each listing page. The sellers see these at the top of their portal.</div>
    <div class="row2"><div class="field"><label for="lp-zv">Zillow views</label><input id="lp-zv" name="zv" inputmode="numeric"></div><div class="field"><label for="lp-zs">Zillow saves</label><input id="lp-zs" name="zs" inputmode="numeric"></div></div>
    <div class="row2"><div class="field"><label for="lp-rv">Redfin views</label><input id="lp-rv" name="rv" inputmode="numeric"></div><div class="field"><label for="lp-rs">Redfin favorites</label><input id="lp-rs" name="rs" inputmode="numeric"></div></div><button class="btn">Update their portal</button></form></details>
${pendingDeal() ? '</div></details>' : ''}` : ''}</div>`;
}
/* ---------- marketing assets: every launch asset for this listing, as a gallery (source/marketing/build_assets.py) ---------- */
/* design usage: which looks and pieces actually get used, so weak looks can be cycled out (Design usage tab; weekly review task) */
function logDesign(look, piece, action) { if (!caps.mcp) return; callTool('Google Sheets', 'append_values', { spreadsheetId: LIVE_SHEET, range: "'Design usage'!A1", values: [[liveNow(), street(), look, piece, action, 'Desk']] }).catch(() => {}); }
document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('#assets .atile a'); if (a) logDesign(activeLook(), (a.querySelector('b') || {}).textContent || '', 'opened'); }, true);
const LOOK_NAMES = [['editorial', 'Estate Editorial'], ['arch', 'Modern Architectural'], ['heritage', 'Warm Heritage']];
function activeLook() { const num = (String(street()).match(/^\d+/) || [''])[0]; return L().mode || (typeof ASSET_LOOK !== 'undefined' && ASSET_LOOK[num]) || 'editorial'; }
function assetsBlock() {
  if (!isStaff() || typeof ASSETS === 'undefined') return '';
  const num = (String(street()).match(/^\d+/) || [''])[0], look = activeLook(), every = ASSETS[num] || [];
  const all = every.filter(a => !a.look || a.look === look);
  if (!all.length) return '';
  const tile = a => `<div class="atile"><a href="${esc(a.u)}" target="_blank" rel="noopener">${a.th ? `<img src="${esc(a.th)}" alt="" loading="lazy">` : '<span class="ph"></span>'}<b>${esc(a.t)}</b></a><button class="chip" data-act="asset-copy" data-u="${esc(a.u)}" data-t="${esc(a.t)}">Copy link</button></div>`;
  const order = [['Listing page', 'Ready now · pages'], ['Page', 'Ready now · pages'], ['Email', 'Ready now · agent email'], ['Carousel', 'Ready now · Instagram carousel'], ['Social', 'Ready now · posts and stories'], ['Film', 'Ready now · films'], ['Onsite', 'Day one · signs, cards and sheets for the home'], ['Print', 'Print · mailers, lookbook and leave-behinds']], groups = {};
  order.forEach(([k, g]) => all.filter(a => a.kind === k).forEach(a => (groups[g] = groups[g] || []).push(a)));
  const hasLooks = every.some(a => a.look);
  const soc = (typeof SocialUI !== 'undefined' && caps.mcp !== undefined) ? SocialUI.html(num) : '';
  const pendNow = pendingDeal() && !(typeof SOCIAL !== 'undefined' && SOCIAL.some(x => x.key === num && x.event === 'pending')) && caps.mcp
    ? `<div class="sharebar" id="socnow"><div class="eyebrow">Under contract posts</div><p class="small muted" style="margin:6px 0 10px">Made automatically once the contract shows up. Want them now?</p><button class="btn" data-act="soc-now" ${ui.socNow ? 'disabled' : ''}>${ui.socNow ? 'Making them · back here in a few minutes' : 'Make the under-contract posts now'}</button></div>` : '';
  // This seller's CMA & launch plan: the private link lives in the Listings tab (column "Launch plan"), never in this page's source
  const lr = ui.listRows || [], pc = lr.length ? lr[0].findIndex(h => /launch plan/i.test(h || '')) : -1, prow = pc < 0 ? null : lr.slice(1).filter(x => homeKeyJs(x[0]) === homeKeyJs(street()) && x[pc]).pop();
  const planBar = prow ? `<div class="sharebar" id="plan"><div class="eyebrow">CMA &amp; launch plan · private</div><p class="small muted" style="margin:6px 0 10px">Made for these sellers only. Unlisted, and never emailed by the system.</p><div class="chips"><a class="chip" href="${esc(prow[pc])}" target="_blank" rel="noopener">Open their plan</a><button class="chip" data-act="asset-copy" data-u="${esc(prow[pc])}" data-t="Launch plan">Copy link</button></div></div>` : '';
  return `${planBar}${pendNow}${soc ? `<div class="sharebar" id="social"><div class="eyebrow">Social posts · see them as they’ll look, then approve</div><p class="small muted" style="margin:6px 0 0">Nothing posts until you tap Approve. Then it’s scheduled in Metricool for the time shown.</p>${soc}</div>` : ''}<div class="sharebar" id="assets"><div class="eyebrow">Marketing assets · ${all.length}</div>
    ${hasLooks ? `<div style="margin-top:10px"><span class="small muted">Look</span> <span class="seg" role="group" aria-label="Marketing look">${LOOK_NAMES.map(([k, n]) => `<button data-act="mode" data-v="${k}" aria-pressed="${look === k}">${n}</button>`).join('')}</span></div>
    <p class="small muted" style="margin:8px 0 0">Every piece is made in all three looks at launch, so switching is instant. The look you pick here is the one you share and print.</p>` : '<p class="small muted" style="margin:6px 0 0">Everything made for this listing. Tap to open, or copy a link to send.</p>'}
    ${Object.keys(groups).map(g => `<div class="small" style="font-weight:600;margin:16px 0 8px">${esc(g)}</div>${/^(Print|Day one)/.test(g) ? '<p class="small muted" style="margin:-4px 0 8px">Print-ready PDFs. Open the ones you want and print them, or send them to your printer or mail house.</p>' : ''}<div class="agrid">${groups[g].map(tile).join('')}</div>`).join('')}
    <p class="small muted" style="margin-top:14px">Want a change? Tell the Concierge (“swap the postcard photo for the deck”). It’s made in a few minutes and comes back for your OK.</p></div>`;
}
const SIGN_SETS = { '19917': { editorial: 'noir', arch: 'daylight', heritage: 'heritage' } }; // look → sign style, printed by source/print/open_house_signs.py
function ohBlock() {
  if (!isStaff()) return '';
  const up = L().openHouses.filter(o => o.status === 'scheduled');
  const nextSat = (() => { const d = new Date(); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7)); return d.toISOString().slice(0, 10); })();
  const opt = (sel) => OH_TIMES.map(([v, t]) => `<option value="${v}" ${v === sel ? 'selected' : ''}>${t}</option>`).join('');
  const num = (String(street()).match(/^\d+/) || [''])[0], ss = SIGN_SETS[num] || {}, styles = ss[activeLook()] ? [[ss[activeLook()], (LOOK_NAMES.find(x => x[0] === activeLook()) || [, ''])[1]]] : [];
  const signs = styles.length ? `<div style="margin-top:12px"><div class="small" style="font-weight:600">Sign-in signs with QR codes · print-ready</div><div class="chips" style="margin-top:8px">${styles.map(([k, t]) => `<a class="chip" href="https://homes.ranchpnw.com/print/open-house-signs-${num}-${k}.pdf" target="_blank" rel="noopener">${t}</a>`).join('')}</div><p class="small muted" style="margin-top:6px">Letter size, 4 pages each. Guests scan, sign in in about 20 seconds, and land in your Leads.</p></div>` : '<p class="small muted" style="margin-top:12px">No sign-in signs for this home yet. Ask your Concierge to make them.</p>';
  return `<div class="sharebar" id="openhouses"><div class="eyebrow">Open houses</div>${signs}
    ${up.length ? `<div class="list" style="margin-top:10px">${up.map(o => `<div><span aria-hidden="true">●</span><span><b>${esc(o.label)}</b><br><span class="small muted">On the listing page · comes off when it ends</span></span>${caps.mcp ? `<button class="btn text small" data-act="oh-cancel" data-id="${esc(o.id)}">Remove</button>` : ''}</div>`).join('')}</div>` : '<p class="small muted" style="margin:8px 0 0">Nothing scheduled. Add one below when the time is set — it won’t show anywhere until you publish it.</p>'}
    ${caps.mcp ? `<details style="margin-top:14px" ${ui.ohOpen ? 'open' : ''}><summary class="btn ghost" style="display:inline-flex">Add an open house</summary>
    <form data-form="oh-add" style="margin-top:16px"><div class="field"><label for="oh-d">Day</label><input id="oh-d" name="day" type="date" required value="${nextSat}"></div>
      <div class="row2"><div class="field"><label for="oh-s">Starts</label><select id="oh-s" name="start">${opt('1300')}</select></div><div class="field"><label for="oh-e">Ends</label><select id="oh-e" name="end">${opt('1500')}</select></div></div>
      <button class="btn" ${ui.busy === 'oh' ? 'disabled' : ''}>${ui.busy === 'oh' ? 'Publishing…' : 'Publish to the listing page'}</button>
      <p class="small muted" style="margin-top:10px">Shows on homes.ranchpnw.com/19917 within a minute. Still add it in NWMLS so it reaches Zillow and Redfin.</p></form></details>`
    : '<p class="small muted" style="margin-top:10px">Open The Desk on claude.ai and allow Google Sheets to add open houses here.</p>'}</div>`;
}

/* ---------- showings on the Desk: from ShowingTime emails. Agent contact shows here only, never in the seller portal. ---------- */
function homeKeyJs(s) { const m = String(s || '').toLowerCase().replace(/street/g, 'st').replace(/[^a-z0-9 ]/g, ' ').match(/^\s*(\d+)\s+(\S+)(?:\s+(\S+))?/); return m ? m.slice(1).filter(Boolean).join(' ') : ''; }
function showList() {
  const k = homeKeyJs(street()), rows = (ui.showRows || []).filter(r => homeKeyJs(r[1]) === k);
  return rows.map(r => ({ key: r[0], at: new Date(r[2]).getTime(), agent: r[3], firm: r[4], phone: r[5], email: r[6], status: r[7], type: r[8] }))
    .filter(x => !isNaN(x.at)).sort((a, b) => b.at - a.at);
}
/* ---------- offers on the Desk: from the Offers tab (logged in the Office). Staff only; never on the seller portal. ---------- */
function mailTid(u) { u = String(u || ''); const f = /thread-f:(\d+)/.exec(u); if (f) { try { return BigInt(f[1]).toString(16); } catch (e) { return ''; } } const h = /#[a-z]+\/([0-9a-f]{12,20})\b/i.exec(u); return h ? h[1] : ''; }
function offerMailHtml(tid, url) {
  const m = (ui.offerMail || {})[tid];
  if (!m) return `<div class="chips" style="margin:10px 0 0"><button class="chip" data-act="offer-mail" data-t="${esc(tid)}">Read the email here</button></div>`;
  if (m === 'loading') return '<p class="small muted" style="margin:10px 0 0">Opening the email…</p>';
  if (m.error) return `<p class="small muted" style="margin:10px 0 0">Couldn’t open it here (${esc(m.error)}). <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open in Gmail</a></p>`;
  return `<div style="margin-top:12px">${m.map(x => `<div style="padding:12px 14px;margin-top:8px;background:var(--paper2,rgba(128,120,108,.08));border-radius:10px"><div class="small"><b>${esc(String(x.sender || '').replace(/<.*>/, '').replace(/"/g, '').trim())}</b> · <span class="muted">${esc(new Date(x.date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))}</span></div>
    <div class="small" style="white-space:pre-wrap;margin-top:6px;line-height:1.5">${esc(String(x.plaintextBody || x.snippet || '').replace(/\n\s*On .{10,120}wrote:[\s\S]*$/, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, 4000))}</div>
    ${(x.attachments || []).filter(a => a.filename).length ? `<div class="small muted" style="margin-top:6px">Attached: ${esc(x.attachments.map(a => a.filename).filter(Boolean).join(', '))}</div>` : ''}</div>`).join('')}
    <div class="chips" style="margin:10px 0 0"><button class="chip" data-act="offer-mail-close" data-t="${esc(tid)}">Hide email</button><a class="chip" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Reply in Gmail</a></div></div>`;
}
const SOC_OFFERED = 2.5;
function socCheck(r) { const pct = v => { const n = parseFloat(String(v || '').replace(/[^\d.]/g, '')); return isNaN(n) ? null : n; }, a = pct(r[15]), b = pct(r[16]), price = +String(r[5]).replace(/[^\d.]/g, '') || 0, base = a == null ? SOC_OFFERED : a;
  if (b == null) return { warn: false, text: (a != null ? a + '% offered · ' : '') + 'asked not filled in yet, check 17(b)' };
  const out = [];
  if (a != null && a !== SOC_OFFERED) out.push(`17(a) shows ${a}% as your offer; you offer ${SOC_OFFERED}%`);
  if (b > base) out.push(`asks ${b}%, ${+(b - base).toFixed(3)}% more than offered${price ? ', about $' + Math.round(price * (b - base) / 100).toLocaleString('en-US') + ' more from the sellers' : ''}`);
  return out.length ? { warn: true, text: 'Discrepancy: ' + out.join('; ') } : { warn: false, text: `${base}% offered · ${b}% asked · matches` };
}
function offerCompare(rs, money, esc, soc) {
  const num = v => +String(v || '').replace(/[^\d.]/g, '') || 0, days = v => { const m = /(\d+)\s*day/i.exec(v || ''); return /waiv/i.test(v || '') ? 0 : m ? +m[1] : null; };
  const when = v => /^\d{4}-\d\d-\d\d$/.test(v || '') ? new Date(v + 'T12:00') : null;
  const short = r => { const t = String(r[2] || 'Offer'), m = /\(([^)]+)\)/.exec(t); return m ? m[1] : t.trim().split(/\s+/).slice(-1)[0]; };
  const rows = [
    ['Price', r => num(r[5]), v => v ? money(v) : '—', 'max', 'highest'],
    ['Seller credit asked', r => num(r[8]), v => v ? money(v) : 'none', 'min', 'lowest'],
    ['Price minus credit', r => num(r[5]) - num(r[8]), v => v ? money(v) : '—', 'max', 'highest'],
    ['Financing', r => r[6] || '—', v => esc(v), '', ''],
    ['Earnest money', r => num(r[7]), v => v ? money(v) : '—', 'max', 'most'],
    ['Inspection', r => r[14] || '', v => esc(v || '—'), 'minDays', 'shortest'],
    ['Closing', r => r[13] || '', v => when(v) ? when(v).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : esc(v || '—'), 'minDate', 'soonest'],
    ['Buyer agent comp', r => soc(r), v => esc(v.text.replace(/^Discrepancy: /, '').replace(' offered · ', ' / ').replace(' asked · matches', ' · match')), 'soc', ''],
    ['Offer expires', r => r[10] || '', v => esc(String(v || '—').replace(/\s*\(offer expires\)/, '').replace(/^No expiration date on the offer$/, 'No deadline')), '', ''],
    ['Agent', r => [r[3], r[4]].filter(Boolean).join(', '), v => esc(v || '—'), '', '']
  ];
  const cell = (row, r, all) => { const [, get, fmt, how, word] = row, v = get(r), vs = all.map(get); let mark = '';
    if (how === 'max' || how === 'min') { const best = how === 'max' ? Math.max(...vs) : Math.min(...vs); if (new Set(vs).size > 1 && v === best) mark = word; }
    if (how === 'minDays') { const d = vs.map(days).filter(x => x != null); if (d.length > 1 && new Set(d).size > 1 && days(v) === Math.min(...d)) mark = word; }
    if (how === 'minDate') { const d = vs.map(when).filter(Boolean).map(x => +x); if (d.length > 1 && new Set(d).size > 1 && when(v) && +when(v) === Math.min(...d)) mark = word; }
    const warn = how === 'soc' && v.warn;
    return `<td style="padding:9px 10px;vertical-align:top;border-top:1px solid rgba(128,120,108,.22);${mark ? 'font-weight:600;' : ''}${warn ? 'color:#B3261E;font-weight:600;' : ''}">${fmt(v)}${mark ? `<div style="font-size:11px;font-weight:500;letter-spacing:.04em;text-transform:uppercase;opacity:.65;margin-top:2px">${mark}</div>` : ''}</td>`; };
  return `<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;margin:0 -4px"><table style="border-collapse:collapse;width:100%;min-width:${140 + rs.length * 130}px;font-size:14px;line-height:1.35">
    <thead><tr><th style="text-align:left;padding:8px 10px;font-size:12px;font-weight:500;opacity:.6"></th>${rs.map(r => `<th style="text-align:left;padding:8px 10px;font-size:15px">${esc(short(r))}<div style="font-size:12px;font-weight:400;opacity:.6">${esc(String(r[0] || '').slice(5, 10).replace('-', '/'))} received</div></th>`).join('')}</tr></thead>
    <tbody>${rows.map(row => `<tr><th style="text-align:left;padding:9px 10px;font-size:13px;font-weight:500;opacity:.7;vertical-align:top;border-top:1px solid rgba(128,120,108,.22);white-space:nowrap">${row[0]}</th>${rs.map(r => cell(row, r, rs)).join('')}</tr>`).join('')}</tbody></table></div>
    <p style="font-size:12px;opacity:.6;margin:8px 2px 0">Labels mark the strongest number in each row, not the better offer. Which offer is better is your sellers’ call.</p>`;
}
function offerAccepted(r) { const st = String(r[9] || ''); return /accept|mutual|pending|under contract/i.test(st) && !/not accepted|unaccepted/i.test(st); }
function offerWho(r) { const t = String(r[2] || 'Offer'), m = /\(([^)]+)\)/.exec(t); return m ? m[1] : t.trim().split(/\s+/).slice(-1)[0]; }
function offerRowNo(r) { const i = (ui.offerRows || []).indexOf(r); return i >= 0 ? i + 2 : 0; } // offerRows start at Offers!A2
async function offerSetStatus(acceptRow) { const k = homeKeyJs(street()), ups = [];
  (ui.offerRows || []).forEach(r => { if (homeKeyJs(r[1]) !== k || /withdrawn|rejected|expired/i.test(r[9] || '')) return; const n = offerRowNo(r), st = String(r[9] || '');
    const to = acceptRow ? (n === acceptRow ? 'Accepted' : /^received|^countered/i.test(st) ? 'Not accepted' : st) : (offerAccepted(r) || /not accepted/i.test(st) ? 'Received' : st);
    if (to !== st) ups.push({ n, r, to }); });
  await Promise.all(ups.map(u => callTool('Google Sheets', 'update_values', { spreadsheetId: LIVE_SHEET, range: 'Offers!J' + u.n, values: [[u.to]] })));
  ups.forEach(u => { u.r[9] = u.to; });
  callTool('Google Sheets', 'append_values', { spreadsheetId: LIVE_SHEET, range: "'Hub done'!A1", values: [[liveNow(), 'offer-status:' + k, acceptRow ? 'offer accepted' : 'offers reopened', ups.map(u => offerWho(u.r) + ' → ' + u.to).join('; ')]] }).catch(() => {});
}
function offerBlock() {
  if (!isStaff() || !caps.mcp || !ui.live) return '';
  const k = homeKeyJs(street()), rs = (ui.offerRows || []).filter(r => homeKeyJs(r[1]) === k && !/withdrawn|rejected|expired/i.test(r[9] || ''));
  if (!rs.length) return '';
  const acc = rs.find(offerAccepted), others = acc ? rs.filter(r => r !== acc) : rs;
  const num = v => +String(v || '').replace(/[^\d.]/g, '') || 0, $ = v => '$' + Math.round(v).toLocaleString('en-US'), lp = num(V('price'));
  const line = (a, b) => b ? `<div style="display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-top:1px solid var(--line)"><span class="small muted" style="flex:0 0 auto;max-width:42%">${esc(a)}</span><span class="small" style="text-align:right">${b}</span></div>` : '';
  const money = v => '$' + Math.round(v).toLocaleString('en-US');
  const card = r => { const p = num(r[5]), c = num(r[8]);
      return `<div style="padding:14px 0 6px"><div><b>${p ? $(p) : 'Price not stated'}</b>${lp && p ? ` · <span class="small">${p === lp ? 'full price' : p > lp ? $(p - lp) + ' over list' : $(lp - p) + ' under list'}</span>` : ''}${r[9] ? ' · ' + esc(r[9]) : ''}<br><span class="small muted">${esc([r[2], r[3] && 'agent ' + r[3], r[4]].filter(Boolean).join(' · '))}</span></div>
      ${socCheck(r).warn ? `<p class="small" style="margin:10px 0 0;padding:8px 10px;border-left:3px solid #B3261E;background:rgba(179,38,30,.07);color:#8C1D18">${esc(socCheck(r).text)}</p>` : ''}<div style="margin-top:8px">${line('Closing date', /^\d{4}-\d\d-\d\d$/.test(r[13] || '') ? new Date(r[13] + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : esc(r[13]))}${line('Inspection', esc(r[14]))}${line('Financing', esc(r[6]))}${line('Earnest money', num(r[7]) ? $(num(r[7])) : '')}${line('Seller credit asked', c ? $(c) : '')}${line('Price minus credit', c && p ? $(p - c) : '')}${line('Buyer agent comp (SOC)', esc(socCheck(r).text.replace(/^Discrepancy: /, '')))}${line('Response due', esc(r[10]))}${line('Received', esc(r[0]))}${line('Notes', esc(r[11]))}</div>
      ${mailTid(r[12]) ? offerMailHtml(mailTid(r[12]), r[12]) : ''}</div>`; };
  return `<div class="sharebar" id="offers" style="border-color:var(--ink,#1E2327)"><div class="eyebrow">${acc ? 'Accepted offer · ' + esc(offerWho(acc)) : rs.length > 1 ? rs.length + ' offers · compare side by side' : 'Offer received · needs your review'}</div>
    ${!acc && rs.length > 1 ? `<div style="margin:12px 0 4px">${offerCompare(rs.slice(), money, esc, socCheck)}</div><details style="margin-top:12px"><summary class="small" style="cursor:pointer;font-weight:600">Each offer in full, with its email</summary>` : ''}
    ${(acc ? [acc] : rs).slice().reverse().map(card).join('')}${!acc && rs.length > 1 ? '</details>' : ''}
    ${acc && others.length ? `<details style="margin-top:12px"${ui.offerOthers ? ' open' : ''}><summary class="small" style="cursor:pointer;font-weight:600">${others.length} other offer${others.length > 1 ? 's' : ''} · ${esc(others.map(r => offerWho(r) + ' ' + money(num(r[5]))).join(' · '))} · side by side</summary><div style="margin:12px 0 4px">${offerCompare(rs.slice(), money, esc, socCheck)}</div>${others.slice().reverse().map(card).join('<hr style="border:0;border-top:1px solid var(--line);margin:0">')}</details>` : ''}
    ${!acc ? `<div class="chips" style="margin:14px 0 0">${rs.map(r => `<button class="chip" data-act="offer-accept" data-r="${offerRowNo(r)}">${ui.offerSure === offerRowNo(r) ? 'Tap again: ' + esc(offerWho(r)) + ' accepted' : esc(offerWho(r)) + ' accepted'}</button>`).join('')}</div><p class="small muted" style="margin:6px 0 0">Once your sellers sign, tap the accepted one. This folds into a summary and the other offers stay saved.</p>` : `<div class="chips" style="margin:12px 0 0"><button class="chip" data-act="offer-reopen">Not accepted after all</button></div>`}
    <p class="small muted" style="margin-top:10px">Private to you. The sellers’ portal never shows offers or agent details.</p></div>`;
}
/* ---------- TC drafts on the Desk: Gmail drafts the TC made for this listing ("Gmail draft created:" rows in TC shadow, column F = the
   draft link). Shown with the exact recipients and message; the agent taps Send twice or edits in Gmail. Nothing sends on its own. ---------- */
const tcKey = r => [r[0], r[1], String(r[2] || '').slice(0, 60)].join(' · ');
function tcDraftIdOf(r) { const m = /msg-a:(r-?\d+)/.exec(String(r[5] || '')); return /^gmail draft created/i.test(r[2] || '') && m ? m[1] : ''; }
function tcWaiting() { const k = homeKeyJs(street()), calls = ui.tcCalls || {};
  const rs = (ui.tcRows || []).filter(r => homeKeyJs(r[1]) === k && (tcDraftIdOf(r) || tcIsCheckin(r)) && !calls[tcKey(r)] && !r[8]).reverse();
  return rs.filter(r => tcDraftIdOf(r)).concat(rs.filter(tcIsCheckin)); }   // Gmail drafts first, then check-ins
/* Chris's Gmail signature and any quoted earlier email ride in the draft's HTML. Split them off so the text shown and edited is only his message,
   and so an edit never strips the signature (Gmail drops the photo when a draft's HTML is rewritten, so an edited draft is re-made with it). */
function tcParts(d) { const h = String((d && d.htmlBody) || ''), at = re => { const i = h.search(re); return i < 0 ? h.length : i; };
  const iq = at(/<div[^>]*class="?gmail_quote/i), is = Math.min(at(/<div>\s*<br\s*\/?>\s*<div[^>]*class="?gmail_signature/i), at(/<div[^>]*class="?gmail_signature/i));
  return { main: h.slice(0, Math.min(iq, is)), sig: is < h.length, quote: iq < h.length }; }
function tcHtmlText(h) { try { const b = new DOMParser().parseFromString(String(h || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|tr|h\d)>/gi, '$&\n'), 'text/html').body;
  return (b.textContent || '').replace(/\u00a0/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim(); } catch (e) { return ''; } }
function tcBodyOf(d) { const p = tcParts(d); return (p.sig || p.quote || !(d && d.plaintextBody)) && p.main ? tcHtmlText(p.main) : String((d && d.plaintextBody) || '').trim(); }
const tcTextHtml = t => '<div dir="ltr">' + esc(String(t || '')).replace(/\n/g, '<br>') + '</div>';
const tcEmails = s => [...new Set(String(s || '').match(/[A-Z0-9._%+'-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])];
/* Check-ins: routine touch-bases the TC writes into the sheet (not Gmail): "Check-in ready:" rows, F = "Subject: …" + body, G = "To: … | CC: …".
   The agent edits, then Approve & send (twice) sends it from Gmail with the Gmail signature; Skip and Change it go to TC feedback. */
const tcIsCheckin = r => /^check-in ready/i.test(r[2] || '');
function tcCheckinOf(r) { const f = String(r[5] || ''), m = /^\s*subject:[ \t]*(.*)\r?\n?/i.exec(f), g = String(r[6] || ''), ci = g.search(/\bcc\s*:/i);
  return { subject: m ? m[1].trim() : '', body: (m ? f.slice(m[0].length) : f).replace(/^\s*\n/, '').trim(), to: tcEmails(ci < 0 ? g : g.slice(0, ci)).join(', '), cc: ci < 0 ? '' : tcEmails(g.slice(ci)).join(', ') }; }
document.addEventListener('input', e => { const f = e.target.closest && e.target.closest('form[data-form=tc-ci]'); if (!f) return; ui.tcCi = ui.tcCi || {};
  ui.tcCi[f.dataset.k] = { to: f.elements.to.value, cc: f.elements.cc.value, subject: f.elements.subject.value, body: f.elements.body.value };
  if (ui.tcSure === f.dataset.k) { ui.tcSure = null; const b = f.querySelector('[data-act=tc-ci-send]'); if (b) b.textContent = 'Approve & send'; } });
async function tcRelinkDesk(oldId, url) { const col = liveRows(await callTool('Google Sheets', 'get_values', { spreadsheetId: LIVE_SHEET, range: "'TC shadow'!F1:F2000" }));
  for (let i = 0; i < col.length; i++) if (String((col[i] || [])[0] || '').indexOf('msg-a:' + oldId) >= 0) await callTool('Google Sheets', 'update_values', { spreadsheetId: LIVE_SHEET, range: "'TC shadow'!F" + (i + 1), values: [[url]] });
  (ui.tcRows || []).forEach(r => { if (String(r[5] || '').indexOf('msg-a:' + oldId) >= 0) r[5] = url; }); }
async function tcRemakeDesk(before, subject, body) { const p = tcParts(before); let replyTo = '';
  if (p.quote && before.threadId) { try { const t = await callTool('Gmail', 'get_thread', { threadId: before.threadId, messageFormat: 'METADATA_ONLY' }), ms = (t && t.messages) || []; if (ms.length) replyTo = ms[ms.length - 1].id; } catch (e) { }
    if (!replyTo) throw new Error('couldn’t find the email it answers, so edit it in Gmail'); }
  const nd = { to: before.toRecipients || [], subject, body, htmlBody: tcTextHtml(body), includeSignature: true };
  if ((before.ccRecipients || []).length) nd.cc = before.ccRecipients; if ((before.bccRecipients || []).length) nd.bcc = before.bccRecipients;
  if ((before.files || []).length) nd.attachments = tcAttOf(before); if (replyTo) nd.replyToMessageId = replyTo;
  const made = await callTool('Gmail', 'create_draft', nd); if (!made || !made.id) throw new Error('Gmail didn’t make the new draft');
  await tcRelinkDesk(before.id, made.viewUrl || ('https://mail.google.com/mail/#drafts?compose=' + made.id));
  await callTool('Gmail', 'delete_draft', { draftId: before.id }).catch(() => { });
  return made.id; }
async function tcCheckinSendDesk(k) { const r = (ui.tcRows || []).find(x => tcKey(x) === k); if (!r) return;
  const c = tcCheckinOf(r), ed = (ui.tcCi || {})[k] || c, to = tcEmails(ed.to), cc = tcEmails(ed.cc);
  if (!to.length) { ui.tcSure = null; render(); return toast('Add who it goes to first.'); }
  if (/\[\s*chris\s*:/i.test(ed.subject + ' ' + ed.body)) { ui.tcSure = null; render(); return toast('Fill in the [Chris: …] spot first.'); }
  if (ui.tcSure !== k) { ui.tcSure = k; return render(); }
  ui.tcSure = null; toast('Sending…');
  try { const msg = { to, subject: ed.subject, body: ed.body, htmlBody: tcTextHtml(ed.body), includeSignature: true }; if (cc.length) msg.cc = cc;
    await callTool('Gmail', 'send_message', msg);
    ui.tcCalls = Object.assign({}, ui.tcCalls, { [k]: 'Sent' }); if (ui.tcCi) delete ui.tcCi[k];
    const orig = 'To: ' + c.to + (c.cc ? ' | CC: ' + c.cc : '') + '\nSubject: ' + c.subject + '\n\n' + c.body, sent = 'To: ' + to.join(', ') + (cc.length ? ' | CC: ' + cc.join(', ') : '') + '\nSubject: ' + ed.subject + '\n\n' + String(ed.body).trim();
    await liveAppend("'TC feedback'", [liveNow(), r[1], k, 'Sent', ('Approved and sent this check-in from the Desk' + (orig.trim() === sent.trim() ? ' as written' : ' with edits') + '.\n\nORIGINAL:\n' + orig + '\n\nAS SENT:\n' + sent).slice(0, 45000)], 'Sent.');
  } catch (e) { toast('Not sent — ' + ((e && e.message) || 'try again') + '.'); }
  render(); }
/* Files on a Gmail draft, read from its RAW form (the regular view of a draft doesn't list attachments). null = couldn't read it. */
function mimeFiles(raw) {
  let t; try { t = atob(String(raw || '').replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '')); } catch (e) { return null; }
  if (!/\r?\n\r?\n/.test(t)) return null;
  const words = s => s.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (m, cs, enc, x) => { try { const bin = /b/i.test(enc) ? atob(x) : x.replace(/_/g, ' ').replace(/=([0-9A-F]{2})/gi, (q, h) => String.fromCharCode(parseInt(h, 16)));
    return new TextDecoder(cs).decode(Uint8Array.from(bin, c => c.charCodeAt(0))); } catch (e) { return m; } });
  const qp = s => s.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (m, h) => String.fromCharCode(parseInt(h, 16)));
  const out = [], seen = {}, bs = [...new Set([...t.matchAll(/boundary="?([^";\r\n]+)"?/gi)].map(m => m[1].trim()))];
  bs.forEach(b => t.split('--' + b).forEach(seg => {
    const i = seg.search(/\r?\n\r?\n/); if (i < 0) return;
    const h = seg.slice(0, i).replace(/\r?\n[ \t]+/g, ' '), body = seg.slice(i).replace(/^\r?\n\r?\n/, '').replace(/\r?\n$/, '');
    if (/content-type:\s*multipart\//i.test(h) || /^\s*-*\s*$/.test(h)) return;
    const f = /filename\*=(?:utf-8'[^']*')?("?)([^";\r\n]+)\1/i.exec(h) || /filename=("?)([^";\r\n]+)\1/i.exec(h) || /\bname=("?)([^";\r\n]+)\1/i.exec(h);
    if (!f) return;
    let name = f[2].trim(); try { if (/filename\*=/i.test(f[0])) name = decodeURIComponent(name); } catch (e) { } name = words(name);
    const type = ((/content-type:\s*([^;\s]+)/i.exec(h) || [])[1] || 'application/octet-stream').toLowerCase(), enc = ((/content-transfer-encoding:\s*([^;\s]+)/i.exec(h) || [])[1] || '').toLowerCase();
    let content; try { content = enc === 'base64' ? body.replace(/[^A-Za-z0-9+/=]/g, '') : btoa(enc === 'quoted-printable' ? qp(body) : body); } catch (e) { return; }
    const disp = /content-disposition:\s*(attachment|inline)/i.exec(h), inline = disp ? /inline/i.test(disp[1]) : /content-id:/i.test(h);
    const key = name + ':' + content.length; if (seen[key]) return; seen[key] = 1;
    out.push({ filename: name, mimeType: type, content, inline, size: Math.floor(content.length * 3 / 4) });
  }));
  return out;
}
// a draft as it is in Gmail right now, with its files (null files = couldn't read them, so never send it from here)
async function gmailDraftDesk(id) { const d = await callTool('Gmail', 'get_draft', { draftId: id, messageFormat: 'FULL_CONTENT' });
  if (!d || !(d.subject || d.plaintextBody || d.toRecipients)) return null;
  let files = null; try { const r = await callTool('Gmail', 'get_draft', { draftId: id, messageFormat: 'RAW' }); files = mimeFiles(r && r.raw); } catch (e) { }
  return Object.assign({}, d, { files }); }
const tcFilesOf = d => ((d && d.files) || []).filter(x => !x.inline);
const tcAttOf = d => ((d && d.files) || []).map(x => { const o = { content: x.content, filename: x.filename, mimeType: x.mimeType }; if (x.inline) o.inline = true; return o; });
const kbOf = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
function tcUrlOf(x) { ui.tcUrls = ui.tcUrls || {}; const k = x.filename + x.content.length; if (!ui.tcUrls[k]) { const b = atob(x.content), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); ui.tcUrls[k] = URL.createObjectURL(new Blob([u], { type: x.mimeType })); } return ui.tcUrls[k]; }
async function tcDraftFetch(id) { ui.tcDraft = ui.tcDraft || {}; if (ui.tcDraft[id]) return; ui.tcDraft[id] = 'loading';
  try { ui.tcDraft[id] = (await gmailDraftDesk(id)) || { error: 'gone' }; }
  catch (e) { ui.tcDraft[id] = { error: /not ?found|404|no draft/i.test((e && e.message) || '') ? 'gone' : ((e && e.message) || 'not available') }; }
  render(); }
function tcBlock() {
  if (!isStaff() || !caps.mcp || !ui.live) return '';
  const rs = tcWaiting(); if (!rs.length) return '';
  const fix = k => ui.tcFix === k ? `<form data-form="tc-fix" data-k="${esc(k)}" style="margin-top:8px"><div class="field"><label>What would you change, or say instead?</label><textarea name="note" rows="3"></textarea></div><div class="chips"><button class="btn" type="submit">Save</button><button class="chip" type="button" data-act="tc-fixx">Cancel</button></div><p class="small muted" style="margin-top:6px">Your TC reads this on its next run and drafts it your way from then on.</p></form>` : '';
  const ciCard = r => { const k = tcKey(r), c = tcCheckinOf(r), ed = (ui.tcCi || {})[k] || c;
    return `<div style="padding:14px 0 6px;border-top:1px solid var(--line)"><div><b>Check-in · ${esc(String(r[2]).replace(/^check-in ready:\s*/i, '').replace(/\s*\(.*$/, ''))}</b></div>${r[4] ? `<p class="small muted" style="margin:4px 0 0">${esc(r[4])}</p>` : ''}
      <form data-form="tc-ci" data-k="${esc(k)}" style="margin-top:8px">
        <div class="field"><label>To</label><input name="to" value="${esc(ed.to)}" placeholder="Add the email address"></div>
        <div class="field"><label>CC</label><input name="cc" value="${esc(ed.cc)}" placeholder="Optional"></div>
        <div class="field"><label>Subject</label><input name="subject" value="${esc(ed.subject)}"></div>
        <div class="field"><label>Message</label><textarea name="body" rows="10" style="min-height:220px">${esc(ed.body)}</textarea></div>
        <p class="small muted" style="margin:0 0 8px">Your Gmail signature is added when it sends.</p>
        <div class="chips"><button class="chip" type="button" data-act="tc-ci-send" data-k="${esc(k)}">${ui.tcSure === k ? 'Tap again to send to ' + esc(tcEmails(ed.to).join(', ')) : 'Approve & send'}</button><button class="chip" type="button" data-act="tc-skip" data-k="${esc(k)}">Skip</button><button class="chip" type="button" data-act="tc-fix" data-k="${esc(k)}">Change it</button></div></form>${fix(k)}</div>`; };
  const card = r => { if (tcIsCheckin(r)) return ciCard(r);
    const id = tcDraftIdOf(r), d = (ui.tcDraft || {})[id], k = tcKey(r), link = esc(r[5]);
    const title = esc(String(r[2]).replace(/^gmail draft created:\s*/i, '').replace(/\s*\(.*$/, ''));
    let inner;
    if (!d || d === 'loading') { if (!d) setTimeout(() => tcDraftFetch(id)); inner = '<p class="small muted" style="margin:8px 0 0">Opening the draft…</p>'; }
    else if (d.error) inner = d.error === 'gone' ? '<p class="small muted" style="margin:8px 0 0">This draft isn’t in Gmail anymore (sent or deleted there). Tap Handled to clear it.</p>'
      : `<p class="small muted" style="margin:8px 0 0">Couldn’t open it here (${esc(d.error)}). <a href="${link}" target="_blank" rel="noopener noreferrer">Open in Gmail</a></p>`;
    else if (ui.tcEdit === k) { const f = tcFilesOf(d);
      inner = `<form data-form="tc-edit" data-k="${esc(k)}" style="margin-top:8px"><p class="small muted" style="margin:0 0 8px">To: ${esc((d.toRecipients || []).join(', '))}${f.length ? ' · keeps ' + esc(f.map(x => x.filename).join(', ')) : ''}</p>
        <div class="field"><label>Subject</label><input name="subject" value="${esc(d.subject || '')}"></div>
        <div class="field"><label>Message</label><textarea name="body" rows="16" style="min-height:320px">${esc(tcBodyOf(d))}</textarea></div>${tcExtra(d) ? `<p class="small muted" style="margin:0 0 8px">Plus ${esc(tcExtra(d))}, kept as they are.</p>` : ''}
        <div class="chips"><button class="btn" type="submit">Save to the draft</button><button class="chip" type="button" data-act="tc-editx">Cancel</button></div>
        <p class="small muted" style="margin-top:8px">Saving updates the same Gmail draft${f.length ? ' and keeps its attachment' : ''}. Nothing sends until you tap Send. Your TC learns from what you change.</p></form>`; }
    else { const f = tcFilesOf(d), to = (d.toRecipients || []).join(', '), blank = /\[\s*chris\s*:/i.test((d.subject || '') + ' ' + tcBodyOf(d));
      const files = f.map((x, i) => { const open = ui.tcView === k + '#' + i;
        return `<div style="margin-top:8px"><div class="small">📎 ${esc(x.filename)} <span class="muted">· ${kbOf(x.size)}</span></div><div class="chips" style="margin:6px 0 0">${/pdf/.test(x.mimeType) ? `<button class="chip" data-act="tc-view" data-k="${esc(k)}" data-i="${i}">${open ? 'Hide' : 'Open the PDF'}</button>` : ''}</div>
          ${open ? `<iframe src="${tcUrlOf(x)}" title="${esc(x.filename)}" style="width:100%;height:70vh;border:1px solid var(--line);margin-top:8px;background:#fff"></iframe>` : ''}</div>`; }).join('');
      inner = `<div style="padding:12px 14px;margin-top:8px;background:var(--paper2,rgba(128,120,108,.08));border-radius:10px"><div class="small"><b>${esc(d.subject || '(no subject)')}</b></div>
        <div class="small muted" style="margin-top:4px">To: ${esc(to)}${(d.ccRecipients || []).length ? ' · CC: ' + esc(d.ccRecipients.join(', ')) : ''}</div>
        <div class="small" style="white-space:pre-wrap;margin-top:8px;line-height:1.5">${esc(tcBodyOf(d))}${tcExtra(d) ? `<span class="muted">\n\n+ ${esc(tcExtra(d))}</span>` : ''}</div>${files}</div>
        <div class="chips" style="margin:10px 0 0">${blank ? `<button class="chip" data-act="tc-edit" data-k="${esc(k)}">Fill in your decision first</button>` : `<button class="chip" data-act="tc-send" data-k="${esc(k)}">${ui.tcSure === k ? 'Tap again to send to ' + esc(to) + (f.length ? ' with ' + f.length + ' attachment' + (f.length > 1 ? 's' : '') : '') : 'Send'}</button><button class="chip" data-act="tc-edit" data-k="${esc(k)}">Edit here</button>`}<a class="chip" href="${link}" target="_blank" rel="noopener noreferrer">Edit in Gmail</a><button class="chip" data-act="tc-handled" data-k="${esc(k)}">Handled</button><button class="chip" data-act="tc-fix" data-k="${esc(k)}">Change it</button></div>${fix(k)}${blank ? '<p class="small muted" style="margin:6px 0 0">This one has a [Chris: …] spot for your decision. Fill it in, then Send appears.</p>' : ''}`; }
    return `<div style="padding:14px 0 6px;border-top:1px solid var(--line)"><div><b>${title}</b></div>${inner}</div>`; };
  return `<div class="sharebar" id="tcdrafts"><div class="eyebrow">Ready to send · ${rs.length} email${rs.length > 1 ? 's' : ''} from your TC</div>${rs.map(card).join('')}
    <p class="small muted" style="margin-top:10px">Nothing goes out until you tap Send or Approve & send. Drafts are also in your Gmail drafts; check-ins live only here and in the Office.</p></div>`;
}
const tcExtra = d => { const p = tcParts(d); return [p.sig ? 'your signature' : '', p.quote ? 'the earlier email, quoted' : ''].filter(Boolean).join(' and '); };
const tcTextOf = d => 'Subject: ' + ((d && d.subject) || '') + '\n\n' + tcBodyOf(d) + (tcFilesOf(d).length ? '\n\n[Attached: ' + tcFilesOf(d).map(x => x.filename).join(', ') + ']' : '');
async function tcSaveDesk(k, subject, body) { const r = (ui.tcRows || []).find(x => tcKey(x) === k); if (!r) return; const id = tcDraftIdOf(r);
  try { const before = await gmailDraftDesk(id); if (!before) throw new Error('the draft is gone');
    if (before.files == null) throw new Error('couldn’t read its attachments, so edit it in Gmail');
    const bp = tcParts(before); let nid = id;
    if (bp.sig || bp.quote) nid = await tcRemakeDesk(before, subject, body);   // keeps the signature photo and the reply thread
    else { const up = { draftId: id, subject, body }; if (before.files.length) up.attachments = tcAttOf(before);   // update_draft drops files unless they're sent again
      await callTool('Gmail', 'update_draft', up); }
    const after = await gmailDraftDesk(nid); (ui.tcDraft = ui.tcDraft || {})[nid] = after || { error: 'gone' }; ui.tcEdit = null;
    const msg = after && tcFilesOf(after).length !== tcFilesOf(before).length ? 'Check the attachment in Gmail: it didn’t carry over.' : 'Saved to the draft.';
    if (after && tcTextOf(before) !== tcTextOf(after)) await liveAppend("'TC feedback'", [liveNow(), r[1], k, 'Edited', ('Edited on the Desk.\n\nBEFORE:\n' + tcTextOf(before) + '\n\nAFTER:\n' + tcTextOf(after)).slice(0, 45000)], msg);
    else toast(msg);
  } catch (e) { toast('Not saved — ' + ((e && e.message) || 'try again') + '.'); }
  render(); }
async function tcSendDesk(k) { const r = (ui.tcRows || []).find(x => tcKey(x) === k); if (!r) return; const id = tcDraftIdOf(r);
  if (ui.tcSure !== k) { ui.tcSure = k; return render(); }
  ui.tcSure = null; toast('Sending…');
  try { const d = await gmailDraftDesk(id);   // re-read: what goes out is what's in Gmail right now, attachments included
    if (!d) throw new Error('the draft is gone');
    if (!(d.toRecipients || []).length) throw new Error('the draft has no recipient');
    if (/\[\s*chris\s*:/i.test((d.subject || '') + ' ' + tcBodyOf(d))) { (ui.tcDraft = ui.tcDraft || {})[id] = d; render(); return toast('Fill in your decision first.'); }
    await callTool('Gmail', 'send_message', { draftId: id });   // Gmail sends the draft exactly as it is (attachments, reply thread) and removes it
    (ui.tcDraft = ui.tcDraft || {})[id] = { error: 'gone' }; ui.tcCalls = Object.assign({}, ui.tcCalls, { [k]: 'Sent' });
    await liveAppend("'TC feedback'", [liveNow(), r[1], k, 'Sent', ('Sent from the Desk.\n\nAS SENT:\n' + tcTextOf(d)).slice(0, 45000)], 'Sent.');
  } catch (e) { toast('Not sent — ' + ((e && e.message) || 'try again') + '.'); }
  render(); }
function showBlock() {
  if (!isStaff() || !caps.mcp) return '';
  const all = showList(), now = Date.now();
  if (!ui.live) return '';
  const up = all.filter(x => x.at >= now - 1800e3 && !/cancel|declin/i.test(x.status)).sort((a, b) => a.at - b.at);
  const done = all.filter(x => x.at < now - 1800e3 && !/cancel|declin/i.test(x.status) && !(ui.fbOk || {})[x.key]).slice(0, 8);
  const tel = p => String(p || '').replace(/[^\d]/g, '').replace(/^1?(\d{10})$/, '+1$1');
  const sms = (x, body) => `sms:${tel(x.phone)}?&body=${encodeURIComponent(body)}`;
  const first = x => String(x.agent || '').split(' ')[0] || 'there';
  const dayOf = x => new Date(x.at).toLocaleDateString('en-US', { weekday: 'long' });
  const timeOf = x => new Date(x.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dayWord = x => { const a = new Date(x.at), n = new Date(); a.setHours(0, 0, 0, 0); n.setHours(0, 0, 0, 0); const d = Math.round((a - n) / 864e5); return d === 0 ? 'today' : d === 1 ? 'tomorrow' : d === -1 ? 'yesterday' : 'on ' + dayOf(x); };
  const me = () => `${T().agent.name} with Keller Williams Realty`;
  const place = () => { const a = V('address') || ''; const c = a.split(',')[1]; return street() + (c ? ', ' + c.trim() : ''); };
  const fbText = x => `Hi ${first(x)}, this is ${me()}, following up on your ${timeOf(x)} showing at ${place()} ${dayWord(x)}. Thanks again for showing it! Do you or your buyers have any questions, feedback or interest I can pass along to my sellers? Thank you!`;
  const preText = x => `Hi ${first(x)}, this is ${me()}. Thanks for booking ${place()} ${dayWord(x)} at ${timeOf(x)}. If you have any questions or need help with access, just reach out. I'm here to help! I'll follow up afterward for feedback. Thank you!`;
  const row = (x, fb) => `<div style="display:block;padding:14px 0"><div><b>${esc(new Date(x.at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))}</b>${x.type === 'Agent preview' ? ' · Agent preview' : ''} · ${esc(x.status)}<br><span class="small muted">${esc(x.agent || 'Agent')}${x.firm ? ' · ' + esc(x.firm) : ''}${x.phone ? ' · ' + esc(x.phone) : ''}</span></div>
    <div class="chips" style="margin:10px 0 0">${x.phone ? (fb ? `<a class="btn" style="min-height:40px;padding:0 16px" href="${sms(x, fbText(x))}">Text for feedback</a>` : `<a class="chip" href="${sms(x, preText(x))}">Text before showing</a>`) + `<a class="chip" href="tel:${tel(x.phone)}">Call</a>` : ''}${fb && x.email ? `<button class="chip" data-act="show-fb" data-k="${esc(x.key)}">${ui.fbDone && ui.fbDone[x.key] ? 'Email draft saved' : 'Email instead'}</button>` : ''}${fb ? `<button class="chip" data-act="show-fbok" data-k="${esc(x.key)}">Got feedback · remove</button>` : ''}</div></div>`;
  return `<div class="sharebar" id="showings"><div class="eyebrow">Showings</div>
    ${all.length ? `${up.length ? `<p class="small" style="margin:10px 0 0">Coming up</p><div>${up.map(x => row(x, false)).join('<hr style="border:0;border-top:1px solid var(--line);margin:0">')}</div>` : ''}
    ${done.length ? `<p class="small" style="margin:16px 0 0">Shown · ask for feedback</p><div>${done.map(x => row(x, true)).join('<hr style="border:0;border-top:1px solid var(--line);margin:0">')}</div>` : ''}`
    : '<p class="small muted" style="margin:8px 0 0">No showings yet. Requests, confirmations and cancellations from ShowingTime appear here within 15 minutes.</p>'}
    <p class="small muted" style="margin-top:10px">Texts open in Messages, already written. Agent details stay here; your sellers see times and status only.</p></div>`;
}
function liveBlock() {
  if (!isStaff()) return '';
  if (caps.mcp && !ui.live && !ui.liveBusy) setTimeout(() => liveLoad(true), 0);
  const lv = ui.live, digits = s => String(s || '').replace(/[^\d+]/g, '');
  const leads = lv && lv.leads ? lv.leads.slice(0, 8) : [];
  const leadHtml = !caps.mcp ? '<p class="small muted">Open The Desk on claude.ai and allow Google Sheets to see live leads here.</p>'
    : lv && lv.error ? `<p class="small muted">${esc(lv.error)}</p>`
    : !lv ? '<p class="small muted">Loading…</p>'
    : !leads.length ? '<p class="small muted">No requests yet. Tour, home-value, follow and question requests from the website land here and in your inbox.</p>'
    : `<div class="list">${leads.map(r => `<div><span aria-hidden="true">●</span><span><b>${esc(r[1])}</b> · ${esc(r[2])}${r[5] ? `<span class="muted small"> · ${esc(String(r[5]).slice(0, 90))}</span>` : ''}<br><span class="small">${r[3] ? `<a href="tel:${digits(r[3])}">Call</a> · <a href="sms:${digits(r[3])}">Text</a> · ` : ''}${r[4] ? `<a href="mailto:${esc(r[4])}">Email</a>` : ''}${r[8] ? ` <span class="muted">· came from ${esc(r[8])}</span>` : ''}</span></span><span class="when">${esc(String(r[0]).split(' ')[0])}</span></div>`).join('')}</div>`;
  const mk = lv && lv.marketing ? lv.marketing.slice(0, 4) : [];
  return `<div style="margin-top:44px" id="live"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap"><h2 class="serif" style="font-size:26px;margin:0">Live from your website</h2>${caps.mcp ? `<button class="btn text small" data-act="live-load" ${ui.liveBusy ? 'disabled' : ''}>${ui.liveBusy ? 'Refreshing…' : 'Refresh'}</button>` : ''}</div>
  <p class="small muted" style="margin:4px 0 14px">Requests from homes.ranchpnw.com and gotehaleh.com${lv && lv.at ? ' · checked ' + ago(lv.at) : ''}</p>
  ${leadHtml}
  ${caps.mcp ? `<details style="margin-top:12px"><summary class="btn ghost" style="display:inline-flex">Log marketing</summary>
    <form data-form="live-mk" style="margin-top:16px"><div class="field"><label for="lm-w">What we did</label><select id="lm-w" name="what">${MARKETING_PRESETS.map(m => `<option data-reach="${esc(m[1])}">${esc(m[0])}</option>`).join('')}</select></div><div class="field"><label for="lm-r">Reach</label><input id="lm-r" name="reach" placeholder="~600 agents"></div><div class="field"><label for="lm-n">Notes the sellers will see</label><input id="lm-n" name="notes" placeholder="Called top Tehaleh agents personally"></div><button class="btn">Add to their timeline</button></form>
    ${mk.length ? `<div class="list" style="margin-top:14px">${mk.map(r => `<div><span aria-hidden="true">✓</span><span>${esc(r[2])}${r[3] ? ' <span class="muted small">· ' + esc(r[3]) + '</span>' : ''}</span><span class="when">${esc(String(r[0]).split(' ')[0])}</span></div>`).join('')}</div>` : ''}</details>
  <details style="margin-top:12px" open><summary class="btn ghost" style="display:inline-flex">Social results</summary>
    <div style="margin-top:14px"><p class="small muted" style="margin:0 0 12px">Pulls reach, clicks and boost results for every Instagram and Facebook post that mentions this home, and puts them on the sellers’ portal.</p><button class="btn" data-act="social-sync" ${ui.busy === 'social' ? 'disabled' : ''}>${ui.busy === 'social' ? 'Pulling from Metricool…' : 'Pull from Metricool'}</button>${ui.socialMsg ? `<p class="small" style="margin-top:10px">${esc(ui.socialMsg)}</p>` : ''}</div></details>
  <details style="margin-top:12px"><summary class="btn ghost" style="display:inline-flex">Log showing feedback</summary>
    <form data-form="live-show" style="margin-top:16px"><div class="field"><label for="ls-i">Interest</label><select id="ls-i" name="interest"><option>Strong interest</option><option>Some interest</option><option>Not for them</option><option>Second showing</option></select></div><div class="field"><label for="ls-f">Feedback (no buyer names)</label><textarea id="ls-f" name="fb" required placeholder="Loved the kitchen and the greenbelt; wondering about the yard size."></textarea></div><button class="btn">Share with the sellers</button></form></details>` : ''}
  </div>`;
}
const METRICOOL_BRAND = '6646044';
const SOCIAL_MATCH = /19917|145th st|homes\.ranchpnw\.com\/19917/i;
const mcDate = v => { const t = String(v || ''); return /^\d{12}/.test(t) ? `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)} ${t.slice(8, 10)}:${t.slice(10, 12)}` : t; };
async function socialSync() {
  ui.busy = 'social'; ui.socialMsg = ''; render();
  try {
    const from = new Date(LC_LISTED - 864e5).toISOString().slice(0, 19) + '-08:00', to = new Date(Date.now() + 864e5).toISOString().slice(0, 19) + '-08:00';
    const q = metrics => callTool('Metricool Social Media Management', 'getAnalyticsDataByMetrics', { brandId: METRICOOL_BRAND, from, to, metrics });
    // instagram: when, text, url, image, reach, views, interactions, spend, paid reach, paid clicks
    const [ig, fb] = await Promise.all([q(['IGPO02', 'IGPO03', 'IGPO06', 'IGPO05', 'IGPO14', 'IGPO28', 'IGPO24', 'IGPO26', 'IGPO19', 'IGPO22']).catch(() => null),
      q(['FBPO02', 'FBPO03', 'FBPO06', 'FBPO05', 'FBPO20', 'FBPO11', 'FBPO13', 'FBPO24', 'FBPO19', 'FBPO09']).catch(() => null)]);
    const rows = [], now = liveNow();
    [['instagram', ig], ['facebook', fb]].forEach(([net, p]) => ((p && p.rows) || []).filter(r => SOCIAL_MATCH.test(String(r[1] || '')) || SOCIAL_MATCH.test(String(r[2] || ''))).forEach(r =>
      rows.push([now, '19917 145th St E', net, mcDate(r[0]), r[2] || '', r[3] || '', r[4] || '', r[5] || '', r[6] || '', r[9] || '', r[7] || '', r[8] || ''])));
    if (!ig && !fb) throw new Error('Metricool didn’t respond');
    if (rows.length) await callTool('Google Sheets', 'append_values', { spreadsheetId: LIVE_SHEET, range: 'Social!A1', values: rows });
    ui.socialMsg = rows.length ? `${rows.length} post${rows.length === 1 ? '' : 's'} updated on the sellers’ portal.` : 'No posts about this home yet. Once the launch posts go out, pull again.';
  } catch (e) { ui.socialMsg = 'Not pulled — ' + ((e && e.message) || 'try again') + '.'; }
  ui.busy = null; render();
}
Object.assign(A, {
  'social-sync': () => socialSync(),
  'live-load': () => liveLoad(),
  'share-listing': async () => { try { if (navigator.share) { await navigator.share({ title: '19917 145th St E · Tehaleh', text: SHARE_TEXT, url: PUBLIC_PAGE }); return; } } catch (e) { if (e && e.name === 'AbortError') return; } copy(PUBLIC_PAGE); },
  'share-copy': () => copy(PUBLIC_PAGE),
  'share-copy-post': () => copy(SHARE_TEXT + '\n\nSee every room and book a private tour: ' + PUBLIC_PAGE),
  'oh-cancel': async (el) => { const id = el.dataset.id, o = ohFromId(id); if (!o) return;
    if (await liveAppend('Open houses', [id, '19917', o.label.split(' · ')[0], '', '', 'Canceled', liveNow()], 'Removed from the listing page.')) { applyOpenHouses([{ id, status: 'Canceled' }]); render(); } },
  'photo-open': () => { ui.photoOpen = true; ui.photoDraft = null; render(); },
  'photo-close': () => { ui.photoOpen = false; ui.photoDraft = null; render(); },
  'photo-mv': el => { const d = photoDraft(), i = d.list.indexOf(el.dataset.id), j = i + Number(el.dataset.d); if (i < 0 || j < 0 || j >= d.list.length) return; d.list.splice(i, 1); d.list.splice(j, 0, el.dataset.id); render(); },
  'photo-top': el => { const d = photoDraft(), i = d.list.indexOf(el.dataset.id); if (i <= 0) return; d.list.splice(i, 1); d.list.unshift(el.dataset.id); render(); },
  'photo-star': el => { const d = photoDraft(), id = el.dataset.id, f = d.featured.indexOf(id); if (f >= 0) d.featured.splice(f, 1); else { if (d.featured.length >= 9) return toast('The top grid holds 9. Unstar one first.'); d.featured.push(id); d.hidden = d.hidden.filter(x => x !== id); } render(); },
  'photo-hide': el => { const d = photoDraft(), id = el.dataset.id; if (d.hidden.includes(id)) d.hidden = d.hidden.filter(x => x !== id); else { d.hidden.push(id); d.featured = d.featured.filter(x => x !== id); } render(); },
  'photo-reset': () => { ui.photoDraft = { list: ALL_MEDIA.map(m => m.id), hidden: [], featured: DEFAULT_FEATURED.slice() }; render(); },
  'photo-save': async () => { const d = photoDraft(); ui.busy = 'photos'; render();
    const ok = await liveAppend('Photo layout', [liveNow(), '19917', JSON.stringify(d.list), JSON.stringify(d.hidden), JSON.stringify(d.featured), T().agent.name], 'Published. The listing page updates within a minute.');
    ui.busy = null; if (ok) { applyLayout({ order: d.list, hidden: d.hidden, featured: d.featured }); ui.layoutSaved = liveNow(); ui.photoOpen = false; ui.photoDraft = null; } render(); },
  'offer-mail': async (el) => { const t = el.dataset.t; ui.offerMail = Object.assign({}, ui.offerMail, { [t]: 'loading' }); render();
    try { const g = await callTool('Gmail', 'get_thread', { threadId: t, messageFormat: 'PLAIN_TEXT' }); ui.offerMail[t] = ((g && g.messages) || []).filter(x => !/no-?reply|do-?not-?reply|mailer-daemon|notifications?@/i.test(x.sender || '')); }
    catch (e) { ui.offerMail[t] = { error: (e && e.message) || 'not available' }; } render(); },
  'offer-accept': async (el) => { const n = +el.dataset.r; if (ui.offerSure !== n) { ui.offerSure = n; return render(); }
    ui.offerSure = null; try { await offerSetStatus(n); toast('Marked accepted. The other offers stay saved.'); } catch (e) { toast('Not saved — ' + ((e && e.message) || 'try again') + '.'); } render(); },
  'offer-reopen': async () => { try { await offerSetStatus(0); toast('Back to comparing offers.'); } catch (e) { toast('Not saved — ' + ((e && e.message) || 'try again') + '.'); } render(); },
  'tc-edit': (el) => { ui.tcEdit = el.dataset.k; ui.tcSure = null; render(); },
  'tc-editx': () => { ui.tcEdit = null; render(); },
  'tc-view': (el) => { const v = el.dataset.k + '#' + el.dataset.i; ui.tcView = ui.tcView === v ? null : v; render(); },
  'tc-send': (el) => { el.disabled = true; tcSendDesk(el.dataset.k); },
  'tc-ci-send': (el) => { el.disabled = true; tcCheckinSendDesk(el.dataset.k); },
  'tc-skip': async (el) => { const k = el.dataset.k, r = (ui.tcRows || []).find(x => tcKey(x) === k); if (!r) return; ui.tcCalls = Object.assign({}, ui.tcCalls, { [k]: 'Skipped' }); if (ui.tcCi) delete ui.tcCi[k]; render();
    await liveAppend("'TC feedback'", [liveNow(), r[1], k, 'Skipped', 'Skipped on the Desk'], 'Skipped. Your TC learns from that too.'); },
  'tc-fix': (el) => { ui.tcFix = el.dataset.k; render(); },
  'tc-fixx': () => { ui.tcFix = null; render(); },
  'tc-handled': async (el) => { const k = el.dataset.k, r = (ui.tcRows || []).find(x => tcKey(x) === k); if (!r) return; ui.tcCalls = Object.assign({}, ui.tcCalls, { [k]: 'Handled' }); render();
    await liveAppend("'TC feedback'", [liveNow(), r[1], k, 'Handled', 'Marked on the Desk'], 'Cleared.'); },
  'offer-mail-close': (el) => { delete (ui.offerMail || {})[el.dataset.t]; render(); },
  'asset-copy': async (el) => { logDesign(activeLook(), el.dataset.t || '', 'copied link'); try { await navigator.clipboard.writeText(el.dataset.u); el.textContent = 'Copied'; } catch (e) { el.textContent = el.dataset.u; } },
  'show-fbok': async (el) => {
    const x = showList().find(s => s.key === el.dataset.k); if (!x) return;
    ui.fbOk = Object.assign({}, ui.fbOk, { [x.key]: 1 }); render();
    await liveAppend('Hub done', [liveNow(), 'fb:' + x.key, 'Feedback received', street() + ' · ' + (x.agent || 'Agent')], 'Removed. Feedback is in.');
  },
  'show-fb': async (el) => {
    const x = showList().find(s => s.key === el.dataset.k); if (!x || !x.email) return;
    const first = String(x.agent || '').split(' ')[0] || 'there';
    const body = `Hi ${first},\n\nThank you for showing ${street()} on ${new Date(x.at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at ${new Date(x.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}. Would you mind sharing a little feedback? A few words on each is perfect:\n\n1. What did your buyers like most?\n2. Anything that gave them pause?\n3. How does it compare with other homes they've seen?\n4. Is it a contender?\n\nIf they have any questions, I'm happy to help. My direct line is ${T().agent.phone}.\n\nThank you!`;
    try { await callTool('Gmail', 'create_draft', { to: [x.email], subject: 'Feedback on ' + street() + '?', body: body + '\n\n— ' + T().agent.name, includeSignature: true });
      ui.fbDone = Object.assign({}, ui.fbDone, { [x.key]: 1 }); toast('Draft saved in Gmail. Review and send.'); render(); }
    catch (e) { toast('Couldn’t save the draft. Try again.'); }
  },
  'portal-copy': () => copy(`Aaron and Holly — your seller portal is live: ${PORTAL_URL}\nYour code: ${PORTAL_CODE}\nYou'll see visits, interest, everything we're doing to market the home, and showing feedback as it comes in. Your share link for social media is on the page too.`)
});
Object.assign(FORMS, {
  'live-update': async f => { const b = f.querySelector('button'); b.disabled = true; if (await liveAppend('Seller updates', [liveNow(), '19917 145th St E', f.headline.value.trim(), f.msg.value.trim(), T().agent.name], 'Posted. Aaron and Holly will see it on their portal.')) f.reset(); b.disabled = false; },
  'live-mk': async f => { const b = f.querySelector('button'); b.disabled = true; if (await liveAppend('Marketing', [liveNow(), '19917 145th St E', f.what.value, f.reach.value.trim(), f.notes.value.trim()], 'Added to the sellers’ timeline.')) f.reset(); b.disabled = false; },
  'live-portal': async f => { const v = n => f[n].value.replace(/[^\d]/g, ''); const rows = []; if (v('zv') || v('zs')) rows.push([liveNow(), '19917 145th St E', 'Zillow', v('zv'), v('zs'), '']); if (v('rv') || v('rs')) rows.push([liveNow(), '19917 145th St E', 'Redfin', v('rv'), v('rs'), '']);
    if (!rows.length) return toast('Add at least one number.'); const b = f.querySelector('button'); b.disabled = true;
    try { await callTool('Google Sheets', 'append_values', { spreadsheetId: LIVE_SHEET, range: 'Portals!A1', values: rows }); toast('Updated. The sellers see it now.'); f.reset(); } catch (e) { toast('Not saved — try again.'); } b.disabled = false; },
  'oh-add': async f => {
    const day = f.day.value, s = f.start.value, e = f.end.value;
    if (!/^\d{4}-\d\d-\d\d$/.test(day)) { toast('Pick a day.'); return; }
    if (e <= s) { toast('The end time needs to be after the start.'); return; }
    const id = 'OH-' + day.replace(/-/g, '') + '-' + s + '-' + e, o = ohFromId(id);
    if (!o || o.end < Date.now()) { toast('That time has already passed.'); return; }
    const [, sl, el] = /· (.+) – (.+)$/.exec(o.label) || [];
    ui.busy = 'oh'; render();
    const ok = await liveAppend('Open houses', [id, '19917', o.label.split(' · ')[0], sl || '', el || '', 'Published', liveNow()], 'Published · ' + o.label);
    ui.busy = null; if (ok) { applyOpenHouses([{ id, status: 'Published' }]); ui.ohOpen = false; } render();
  },
  'live-show': async f => { const b = f.querySelector('button'); b.disabled = true; if (await liveAppend('Showings', [liveNow(), '19917 145th St E', f.interest.value, f.fb.value.trim()], 'Shared with the sellers.')) f.reset(); b.disabled = false; }
});
document.addEventListener('change', e => { if (e.target && e.target.id === 'lm-w') { const r = e.target.selectedOptions[0].dataset.reach, i = document.getElementById('lm-r'); if (i && r && !i.value) i.value = r; } });


/* ---------- seller questions and the improvement tools for this home (source/app/src/improve.js) ---------- */
function improveBlock() {
  if (!isStaff() || typeof ImproveUI === 'undefined') return '';
  const items = ImproveUI.needs().filter(x => !/^Weekly review/.test(x.t)), qs = ImproveUI.questionsFor(street());
  const recent = qs.filter(x => x.r[4]).slice(-4).reverse();
  return `<div class="sharebar" id="sellerq"><div class="eyebrow">Seller questions</div>
    ${items.length ? items.map(x => `<div style="margin-top:12px"><div class="small" style="font-weight:600">${esc(x.t)}</div><div class="small muted" style="margin:4px 0 8px">${esc(x.s)}</div>${x.acts}</div>`).join('') : '<p class="small muted" style="margin:6px 0 0">Nothing waiting. Sellers ask in their portal (“Ask Chris”); facts from the contract are answered for you, anything else comes here.</p>'}
    ${recent.length ? `<details style="margin-top:12px"><summary class="small muted" style="cursor:pointer">Recent questions (${recent.length})</summary>${recent.map(x => `<p class="small" style="margin:8px 0 0">“${esc(x.r[4])}”<br><span class="muted">${esc(x.r[6] || 'Not answered yet')}</span></p>`).join('')}</details>` : ''}
    ${ImproveUI.tools()}</div>`;
}
