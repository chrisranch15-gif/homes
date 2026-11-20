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
  <section class="bsec wrap"><div class="eyebrow" style="text-align:center">The rooms you made home</div><div class="bphotos">${['great-room', 'kitchen-island', 'primary-bed2', 'deck-fire', 'rainier-view2', 'greenbelt-yard'].map(id => img(id, '')).join('')}</div></section>
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
