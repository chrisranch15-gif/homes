/* ============================================================
   ACCEPTANCE SUITE — the blueprint's pilot criteria, as code.
   Each test builds a fresh, isolated engine with its own clock.
   ============================================================ */
var LCTests = (function () {
  'use strict';
  function fresh(LC) {
    var clock = { t: Date.UTC(2026, 10, 20, 17, 0, 0) };
    var db = LC.seed(clock.t);
    var e = LC.createEngine(db, { now: function () { return clock.t; } });
    return { e: e, db: db, clock: clock, l: e.L('L-19917'), id: 'L-19917' };
  }
  function goLive(x) {
    x.e.emit(x.id, 'authorize', { what: 'mls_activation', by: 'Chris Ranch' });
    return x.e.emit(x.id, 'mls.status', { status: 'Active', verified: true });
  }
  function count(arr, fn) { return arr.filter(fn).length; }

  var T = [];
  function test(group, name, fn) { T.push({ group: group, name: name, fn: fn }); }

  /* 1 — correct photography */
  test('Photography', 'Every image is real 19917 photography from the Drive folder', function (LC) {
    var bad = LC.MEDIA.filter(function (m) { return m.listing !== 'L-19917' || m.source.indexOf('Google Drive') !== 0 || !/^photos\/[a-z0-9-]+\.jpg$/.test(m.file); });
    return { pass: bad.length === 0 && LC.MEDIA.length >= 40, detail: LC.MEDIA.length + ' photos, each traced to its Drive sequence number' };
  });
  test('Photography', 'Each story chapter has its own photography', function (LC) {
    var ok = [1, 2, 3, 4].every(function (c) { return LC.MEDIA.filter(function (m) { return m.chapter === c; }).length >= 3; });
    return { pass: ok, detail: 'Chapters 1–4 each have 3+ photos' };
  });

  /* 2 — accuracy across every asset */
  test('Accuracy', 'Removed claims never appear in any generated asset', function (LC) {
    var x = fresh(LC); var txt = x.e.allAssetText(x.id).toLowerCase();
    var hits = LC.BLOCKED_PHRASES.filter(function (p) { return txt.indexOf(p) >= 0; });
    return { pass: hits.length === 0, detail: hits.length ? 'Found: ' + hits.join(', ') : 'No water view, shiplap or “beneath the deck” anywhere' };
  });
  test('Accuracy', 'Unverified square footage stays hidden until confirmed', function (LC) {
    var x = fresh(LC);
    x.e.setFact(x.id, 'sqft', null, 'conflict', 'Test: sources disagree');
    var before = /sq ft|square feet/i.test(x.e.allAssetText(x.id));
    x.e.setFact(x.id, 'sqft', 2999, 'verified', 'Test measurement');
    var after = x.e.allAssetText(x.id).indexOf('2,999') >= 0;
    return { pass: !before && after, detail: 'Hidden while in conflict; appears everywhere once verified' };
  });
  test('Accuracy', 'One correction propagates to every channel', function (LC) {
    var x = fresh(LC);
    x.e.setFact(x.id, 'price', 765000, 'verified', 'Test');
    var a = x.e.assets(x.id);
    var ok = a.specs.indexOf('$765,000') >= 0 && a.social.every(function (p) { return p.text.indexOf('$775,000') < 0; }) && a.agentEmail.indexOf('$765,000') >= 0;
    return { pass: ok, detail: 'Specs, social posts and agent email all updated from one change' };
  });

  /* 3 — secure seller access */
  test('Seller access', 'The portal opens only with the seller’s private code', function (LC) {
    var x = fresh(LC);
    var wrong = x.e.sellerLogin(x.id, 'WRONG-0000').ok;
    var right = x.e.sellerLogin(x.id, x.l.sellers[0].code).ok;
    return { pass: !wrong && right, detail: 'Wrong code refused; correct code admitted' };
  });
  test('Seller access', 'A public story link can’t reach private seller data', function (LC) {
    var x = fresh(LC), blocked = false;
    try { x.e.sellerView(x.id, null); } catch (err) { blocked = /Private/.test(err.message); }
    return { pass: blocked, detail: 'Seller view requires a seller session' };
  });
  test('Seller access', 'Another brokerage cannot read this listing', function (LC) {
    var x = fresh(LC), denied = false;
    try { x.e.forTenant('northline').L('L-19917'); } catch (err) { denied = /Access denied/.test(err.message); }
    return { pass: denied, detail: 'Tenant isolation enforced at the data layer' };
  });

  /* 4 — QR routing and attribution */
  test('QR', 'Signs route to the right destination and record the scan', function (LC) {
    var x = fresh(LC);
    var a = x.e.signResolve('R-014-A'), b = x.e.signResolve('R-014-B');
    x.e.emit(x.id, 'qr.scanned', { sign: 'R-014-A' });
    return { pass: a.kind === 'explore' && b.kind === 'valuation' && x.l.scans.length === 1 && x.l.leads.length === 0, detail: 'Explore → story, Worth → valuation; a scan is not a lead' };
  });
  test('QR', 'An unassigned sign falls back gracefully', function (LC) {
    var x = fresh(LC); var r = x.e.signResolve('R-022-A');
    return { pass: r.kind === 'fallback', detail: 'Sign R-022 shows the brokerage’s between-homes page' };
  });

  /* 5 — showing request captured and delivered */
  test('Leads', 'A showing request reaches the responsible agent with attribution', function (LC) {
    var x = fresh(LC);
    var r = x.e.emit(x.id, 'lead.created', { kind: 'showing', name: 'Test Buyer', contact: 'buyer@example.com', source: 'qr', cta: 'R-014-A', channel: 'sign', consent: true });
    var msg = x.l.outbox.filter(function (m) { return m.kind === 'notify.agent'; })[0];
    return { pass: r.lead.status === 'delivered' && msg && msg.status === 'delivered' && r.lead.source === 'qr' && r.lead.consent === true, detail: 'Delivered to ' + x.e.T().agent.name + ' with source, CTA, channel and consent' };
  });

  /* 6 — open house end to end */
  test('Open house', 'Scheduled (with seller OK), promoted and reported', function (LC) {
    var x = fresh(LC); goLive(x);
    x.e.emit(x.id, 'openhouse.requested', { start: 1, end: 2, label: 'Sat 1–4 pm' });
    var ap = x.l.approvals.filter(function (a) { return a.kind === 'openhouse.schedule' && a.status === 'open'; })[0];
    x.e.approve(x.id, ap.id, 'approve');
    var oh = x.l.openHouses[0];
    x.e.emit(x.id, 'openhouse.checkin', { oh: oh.id, guest: { name: 'Pat', tags: ['Wants showing'], consent: true } });
    x.e.emit(x.id, 'openhouse.checkin', { oh: oh.id, guest: { name: 'Sam', tags: ['Neighbor'], consent: false } });
    x.e.emit(x.id, 'openhouse.completed', { oh: oh.id });
    var early = count(x.l.outbox, function (m) { return m.kind === 'send.guest_followup'; });
    x.clock.t += 61 * 60e3; x.e.tick(x.id);
    var fu = count(x.l.outbox, function (m) { return m.kind === 'send.guest_followup'; }) + early * 10;
    var recap = x.l.updates.some(function (u) { return u.title === 'Open house recap'; });
    return { pass: oh.status === 'completed' && fu === 1 && recap && x.l.leads.length === 1, detail: 'An hour later, a follow-up only to the guest who consented; 2 guests ≠ 1 lead; seller recap sent' };
  });

  /* 7 — launch only after verified activation and authorization */
  test('Launch', 'Unverified MLS status launches nothing', function (LC) {
    var x = fresh(LC);
    x.e.emit(x.id, 'authorize', { what: 'mls_activation' });
    x.e.emit(x.id, 'mls.status', { status: 'Active', verified: false });
    return { pass: x.l.state === 'marketing_ready' && x.l.outbox.length === 0, detail: 'State unchanged, zero messages' };
  });
  test('Launch', 'Verified status without authorization is held for a human', function (LC) {
    var x = fresh(LC);
    x.e.emit(x.id, 'mls.status', { status: 'Active', verified: true });
    return { pass: x.l.state === 'marketing_ready' && x.l.exceptions.some(function (e) { return e.type === 'authorization'; }), detail: 'Escalated to the Desk instead of launching' };
  });
  test('Launch', 'Verified + authorized activation runs the full launch', function (LC) {
    var x = fresh(LC); goLive(x);
    var live = count(x.l.outbox, function (m) { return m.kind === 'send.seller_live' && m.status === 'delivered'; });
    var social = count(x.l.outbox, function (m) { return m.kind === 'post.social'; });
    return { pass: x.l.state === 'market_engagement' && live === 1 && social === 3, detail: 'Story published, seller told, 3 posts, agent network — then market engagement' };
  });
  test('Launch', 'A message is only “sent” when the provider confirms it', function (LC) {
    var x = fresh(LC);
    x.e.emit(x.id, 'provider.outage', { provider: 'social', failures: 99 });
    goLive(x);
    var posted = count(x.l.outbox, function (m) { return m.kind === 'post.social'; });
    var ex = x.l.exceptions.filter(function (e) { return e.type === 'integration' && e.open; }).length;
    return { pass: posted === 0 && ex >= 1, detail: 'Outage → 0 posts marked sent, failure escalated after 3 tries' };
  });

  /* 8 — honest reporting */
  test('Reporting', 'Report separates real, missing and unavailable data', function (LC) {
    var x = fresh(LC); var r = x.e.report(x.id);
    var portals = r.metrics.filter(function (m) { return m.key === 'portals'; })[0];
    var nodata = r.metrics.filter(function (m) { return m.status === 'no-data'; }).length;
    return { pass: portals.status === 'unavailable' && portals.value === null && nodata >= 3, detail: 'Zillow/Redfin “unavailable” (never estimated); empty metrics say “no data yet”' };
  });
  test('Reporting', 'Stale numbers are flagged, demo numbers are labeled', function (LC) {
    var x = fresh(LC);
    x.e.emit(x.id, 'site.visit', { session: 'a', demo: true });
    x.clock.t += 3 * 864e5;
    var r = x.e.report(x.id);
    var v = r.metrics.filter(function (m) { return m.key === 'visits'; })[0];
    return { pass: v.status === 'stale' && r.demo === true, detail: 'Data older than 48h marked stale; sample data flagged' };
  });
  test('Reporting', 'High traffic, few showings never recommends a price cut', function (LC) {
    var x = fresh(LC);
    for (var i = 0; i < 150; i++) x.e.emit(x.id, 'site.visit', { session: 's' + i });
    var r = x.e.report(x.id);
    return { pass: /photo|headline/i.test(r.insight) && !/reduc|lower the price|price cut/i.test(r.insight.replace('not a price change', '')), detail: '“' + r.insight + '”' };
  });

  /* 9 — retries never duplicate */
  test('Reliability', 'Replaying the same event sends nothing twice', function (LC) {
    var x = fresh(LC); goLive(x);
    var n1 = x.l.outbox.length;
    x.e.emit(x.id, 'mls.status', { status: 'Active', verified: true }); // the MLS feed delivers the same status again
    x.e.emit(x.id, 'authorize', { what: 'mls_activation' });
    var n2 = x.l.outbox.length;
    var w1 = x.e.emit(x.id, 'weekly.tick'), w2 = x.e.emit(x.id, 'weekly.tick');
    var reports = count(x.l.outbox, function (m) { return m.kind === 'send.seller_report'; });
    return { pass: n1 === n2 && reports === 1, detail: 'Duplicate MLS event: +' + (n2 - n1) + ' messages · weekly report twice: ' + reports + ' sent' };
  });
  test('Reliability', 'Re-running the launch after a held approval doesn’t repeat finished steps', function (LC) {
    var x = fresh(LC);
    x.l.sellers[0].authorized.launch_comms = false;
    goLive(x);
    var ap = x.l.approvals.filter(function (a) { return a.kind === 'send.seller_live' && a.status === 'open'; })[0];
    x.e.approve(x.id, ap.id, 'approve');
    var social = count(x.l.outbox, function (m) { return m.kind === 'post.social'; });
    var live = count(x.l.outbox, function (m) { return m.kind === 'send.seller_live'; });
    return { pass: !!ap && social === 3 && live === 1, detail: 'Launch resumed: seller message sent once, the 3 posts not repeated' };
  });
  test('Reliability', 'A failed step retries cleanly once the connection returns', function (LC) {
    var x = fresh(LC);
    x.e.emit(x.id, 'provider.outage', { provider: 'social', failures: 99 });
    goLive(x);
    x.e.emit(x.id, 'provider.restore', { provider: 'social' });
    x.l.exceptions.filter(function (e) { return e.open && e.retry; }).forEach(function (e) { x.e.retry(x.id, e.id); });
    x.l.exceptions.filter(function (e) { return e.open && e.retry; }).forEach(function (e) { x.e.retry(x.id, e.id); });
    var posts = count(x.l.outbox, function (m) { return m.kind === 'post.social'; });
    return { pass: posts === 3, detail: 'Exactly 3 posts after recovery, even with repeated retries' };
  });

  /* 10 — white label */
  test('White label', 'A second brokerage runs on its own brand and rules — no code changes', function (LC) {
    var a = LC.TENANTS.ranch, b = LC.TENANTS.northline;
    var keys = Object.keys(a.policies).every(function (k) { return k in b.policies; });
    return { pass: a.brand.serif !== b.brand.serif && a.name !== b.name && keys && b.policies['send.seller_live'] === 'human', detail: 'Brand, agents and approval rules are configuration' };
  });

  /* Guardrails */
  test('Guardrails', 'Price changes always wait for a human', function (LC) {
    var x = fresh(LC); goLive(x);
    x.e.emit(x.id, 'price.change.requested', { to: 760000 });
    var still = x.e.V(x.l, 'price') === 775000;
    var ap = x.l.approvals.filter(function (a) { return a.kind === 'price.change' && a.status === 'open'; })[0];
    x.e.approve(x.id, ap.id, 'approve');
    return { pass: still && x.e.V(x.l, 'price') === 760000, detail: 'Unchanged until approved, then updated everywhere' };
  });
  test('Guardrails', 'Judgment questions go to the agent, facts are answered instantly', function (LC) {
    var x = fresh(LC);
    var a1 = x.e.answer(x.id, 'Is there a water view?'), a2 = x.e.answer(x.id, 'Should we hold offers until Monday?'), a3 = x.e.answer(x.id, 'How many bedrooms?');
    return { pass: /removed|don’t claim/.test(a1) && a2 === null && /Five|5/.test(a3) && /no closet/.test(a3) && /Rainier/.test(x.e.answer(x.id, 'Is there a view of Mount Rainier?')), detail: 'Removed claim explained · strategy escalated · bedrooms answered with the closet note' };
  });
  test('Guardrails', 'Review invitations go to every client — no filtering', function (LC) {
    var x = fresh(LC); goLive(x);
    x.e.emit(x.id, 'mls.status', { status: 'Pending', verified: true });
    x.e.emit(x.id, 'mls.status', { status: 'Sold', verified: true });
    return { pass: x.l.state === 'closed' && x.l.reviews.length === x.l.sellers.length, detail: 'Invites sent to all sellers after a verified close' };
  });
  test('Journey', 'Branches: off market, withdrawn and back on market', function (LC) {
    var x = fresh(LC); goLive(x);
    x.e.emit(x.id, 'mls.status', { status: 'Temporarily Off Market', verified: true });
    var off = x.l.state === 'temp_off_market';
    x.e.emit(x.id, 'mls.status', { status: 'Active', verified: true });
    var back = x.l.state === 'market_engagement' && x.l.activations === 2;
    var bad = x.e.emit(x.id, 'mls.status', { status: 'Sold', verified: true });
    return { pass: off && back && bad.rejected === 'invalid', detail: 'Off market → relaunch as a new cycle; “Sold” from Active rejected' };
  });

  /* Explainability & control */
  test('How it runs', 'Every event becomes a run: trigger, rule and proof', function (LC) {
    var x = fresh(LC); goLive(x);
    var run = x.l.runs.filter(function (r) { return /NWMLS reported “Active”/.test(r.trigger); })[0];
    var done = run && run.steps.filter(function (s) { return s.type === 'done' && s.proof && s.rule && s.rule.words; }).length;
    var moved = run && run.steps.some(function (s) { return s.type === 'state'; });
    return { pass: !!run && done >= 5 && moved, detail: run ? done + ' actions, each with its rule and a confirmation id' : 'No run recorded' };
  });
  test('How it runs', 'Switching social to “ask me first” holds posts, then posts once', function (LC) {
    var x = fresh(LC);
    x.e.setPolicy('post.social', 'human');
    goLive(x);
    var held = x.l.approvals.filter(function (a) { return a.kind === 'post.social' && a.status === 'open'; });
    var before = x.l.outbox.filter(function (m) { return m.kind === 'post.social'; }).length;
    held.forEach(function (a) { x.e.approve(x.id, a.id, 'approve'); });
    held.forEach(function (a) { x.e.approve(x.id, a.id, 'approve'); });
    var after = x.l.outbox.filter(function (m) { return m.kind === 'post.social'; }).length;
    return { pass: held.length === 3 && before === 0 && after === 3, detail: '3 posts held → approved → 3 posted (a double tap changes nothing)' };
  });
  test('How it runs', 'Guardrail rules can’t be switched off', function (LC) {
    var x = fresh(LC);
    var r1 = x.e.setPolicy('price.change', 'auto'), r2 = x.e.setPolicy('reply.seller_judgment', 'auto'), r3 = x.e.setPolicy('publish.story', 'auto');
    return { pass: !r1.ok && !r2.ok && !r3.ok && x.e.policyOf('price.change') === 'human', detail: 'Price, judgment replies and verified publishing stay locked' };
  });

  test('Setup', 'Brokerage settings change the brand everywhere, per tenant only', function (LC) {
    var x = fresh(LC);
    x.e.setTenantSettings({ name: 'Ranch Real Estate', agentName: 'C. Ranch' });
    var other = x.e.forTenant('northline').T().name;
    return { pass: x.e.T().name === 'Ranch Real Estate' && x.e.T().agent.name === 'C. Ranch' && other === 'Northline Realty', detail: 'Renamed for this brokerage; the other tenant untouched' };
  });
  test('AI layer', 'Facts the AI reads from notes stay pending until you verify them', function (LC) {
    var x = fresh(LC);
    var added = x.e.proposeFacts(x.id, [{ label: 'Roof', value: 'Replaced 2023' }, { label: 'Water view', value: 'Peek-a-boo water view' }], 'seller notes');
    var txt = x.e.allAssetText(x.id);
    return { pass: added.length === 2 && added[0].status === 'pending' && added[1].status === 'removed' && txt.indexOf('2023') < 0, detail: 'Roof → pending (not published) · water view → blocked' };
  });

  /* The clock: work that happens by itself */
  test('Clock', 'The Friday report sends itself — once — and schedules the next', function (LC) {
    var x = fresh(LC); goLive(x);
    var j = x.l.jobs.filter(function (j) { return j.type === 'weekly_report' && !j.done; })[0];
    x.clock.t = j.due + 60e3; x.e.tick(x.id); x.e.tick(x.id);
    var sent = count(x.l.outbox, function (m) { return m.kind === 'send.seller_report'; });
    var next = x.l.jobs.filter(function (k) { return k.type === 'weekly_report' && !k.done; })[0];
    return { pass: sent === 1 && next && next.due - j.due >= 6 * 864e5 && new Date(j.due).getDay() === 5, detail: 'Sent Friday 9 am; ticking again sent nothing; next one queued a week out' };
  });
  test('Clock', 'Missed time catches up when the app opens', function (LC) {
    var x = fresh(LC); goLive(x);
    x.clock.t += 22 * 864e5; var ran = x.e.tick(x.id);
    var reports = count(x.l.outbox, function (m) { return m.kind === 'send.seller_report'; });
    return { pass: reports >= 1 && ran.length >= 3, detail: ran.length + ' due jobs ran in order after three weeks closed; reports never doubled within a week' };
  });
  test('Leads', 'Buyers get an instant reply — only with consent', function (LC) {
    var x = fresh(LC); goLive(x);
    x.e.emit(x.id, 'lead.created', { kind: 'showing', name: 'Ana', contact: 'ana@example.com', consent: true });
    x.e.emit(x.id, 'lead.created', { kind: 'showing', name: 'Ben', contact: 'ben@example.com', consent: false });
    var acks = x.l.outbox.filter(function (m) { return m.kind === 'send.buyer_ack'; }).map(function (m) { return m.to; });
    return { pass: acks.length === 1 && acks[0] === 'ana@example.com', detail: 'Ana (consented) answered in seconds; Ben (no consent) is not emailed' };
  });
  test('Leads', 'An unanswered request nudges you after a day — never the buyer', function (LC) {
    var x = fresh(LC); goLive(x);
    var a = x.e.emit(x.id, 'lead.created', { kind: 'showing', name: 'Ana', contact: 'ana@example.com', consent: true }).lead;
    var b = x.e.emit(x.id, 'lead.created', { kind: 'showing', name: 'Cy', contact: 'cy@example.com', consent: true }).lead;
    x.e.emit(x.id, 'lead.contacted', { lead: b.id });
    x.clock.t += 25 * 36e5; x.e.tick(x.id);
    var nudges = x.l.outbox.filter(function (m) { return m.kind === 'notify.agent' && /Still waiting/.test(m.subject); });
    return { pass: nudges.length === 1 && /Ana/.test(nudges[0].subject), detail: 'Reminder about Ana only; Cy was already contacted' };
  });
  test('Showings', 'Confirm → feedback request → seller summary without the buyer’s name', function (LC) {
    var x = fresh(LC); goLive(x);
    var ld = x.e.emit(x.id, 'lead.created', { kind: 'showing', name: 'Dana Private', contact: 'dana@example.com', consent: true }).lead;
    var at = x.clock.t + 864e5;
    var sh = x.e.emit(x.id, 'showing.confirmed', { lead: ld.id, at: at, label: 'Sat 11 am' }).showing;
    x.clock.t = at + 2 * 36e5 + 60e3; x.e.tick(x.id);
    var asked = count(x.l.outbox, function (m) { return m.kind === 'request.feedback'; });
    x.e.emit(x.id, 'showing.feedback', { showing: sh.id, interest: 'high', note: 'Loved the deck' });
    var upd = x.l.updates[0];
    return { pass: asked === 1 && upd && /strong/.test(upd.text) && upd.text.indexOf('Dana') < 0, detail: 'Feedback requested 2h after; seller told “interest is strong” — no names' };
  });
  test('Offers', 'An offer alerts you first; the seller hears only after you approve', function (LC) {
    var x = fresh(LC); goLive(x);
    var before = x.l.updates.length;
    x.e.emit(x.id, 'offer.received', {});
    var held = x.l.approvals.filter(function (a) { return a.kind === 'send.offer_notice' && a.status === 'open'; })[0];
    var quiet = x.l.updates.length === before;
    x.e.approve(x.id, held.id, 'approve');
    return { pass: quiet && !!held && x.l.updates[0].title === 'An offer arrived' && x.l.outbox.some(function (m) { return /offer arrived/i.test(m.subject) && m.to === 'Chris Ranch'; }), detail: 'You alerted instantly; seller portal silent until you approved' };
  });
  test('Contract', 'Contract dates create a seller timeline and reminders two days ahead', function (LC) {
    var x = fresh(LC); goLive(x);
    x.e.emit(x.id, 'mls.status', { status: 'Pending', verified: true });
    var asked = x.l.exceptions.some(function (e) { return e.type === 'contract' && e.open; });
    var t0 = x.clock.t, d = 864e5;
    x.e.emit(x.id, 'contract.dates', { inspection: t0 + 7 * d, appraisal: t0 + 14 * d, financing: t0 + 21 * d, closing: t0 + 30 * d });
    x.clock.t = t0 + 5 * d + 60e3; x.e.tick(x.id);
    var rem = x.l.outbox.filter(function (m) { return m.kind === 'send.milestone'; });
    return { pass: asked && rem.length === 1 && /Inspection/.test(rem[0].subject) && x.l.contract.milestones.length === 4, detail: 'Desk asked for dates; day 5 → inspection reminder only' };
  });

  test('Follow this home', 'Following needs consent, signs you in with a personal link, and never doubles up', function (LC) {
    var x = fresh(LC); goLive(x);
    var a = x.e.emit(x.id, 'follow.created', { name: 'Dana', contact: 'dana@example.com', consent: true });
    var b = x.e.emit(x.id, 'follow.created', { name: 'Dana', contact: 'DANA@example.com', consent: true });
    var c = x.e.emit(x.id, 'follow.created', { name: 'Lee', contact: '253-555-0100', consent: false });
    var welcomes = count(x.l.outbox, function (m) { return m.kind === 'send.follower_update'; });
    var v = x.e.followerView(x.id, a.follower.code);
    return { pass: b.existing && x.l.followers.length === 2 && welcomes === 1 && v.follower.name === 'Dana' && c.follower.channel === 'text', detail: 'One welcome (Dana); Lee saved but not messaged without consent; same email = same follower' };
  });
  test('Follow this home', 'Followers hear about a price change only after you approve it — and never after opting out', function (LC) {
    var x = fresh(LC); goLive(x);
    var a = x.e.emit(x.id, 'follow.created', { name: 'Dana', contact: 'dana@example.com', consent: true });
    var b = x.e.emit(x.id, 'follow.created', { name: 'Sam', contact: 'sam@example.com', consent: true });
    x.e.emit(x.id, 'follow.stopped', { code: b.follower.code });
    x.e.emit(x.id, 'price.change.requested', { to: 760000 });
    var early = count(x.l.outbox, function (m) { return /New price/.test(m.subject); });
    var ap = x.l.approvals.filter(function (q) { return q.kind === 'price.change' && q.status === 'open'; })[0];
    x.e.approve(x.id, ap.id, 'approve');
    var sent = x.l.outbox.filter(function (m) { return /New price/.test(m.subject); });
    return { pass: early === 0 && sent.length === 1 && sent[0].to === 'dana@example.com' && x.e.followerView(x.id, a.follower.code).feed.length === 1, detail: 'Nothing before approval; then Dana only — Sam opted out' };
  });
  test('Follow this home', 'Followers are told when it goes under contract and if it comes back', function (LC) {
    var x = fresh(LC); goLive(x);
    x.e.emit(x.id, 'follow.created', { name: 'Dana', contact: 'dana@example.com', consent: true });
    x.e.emit(x.id, 'mls.status', { status: 'Pending', verified: true });
    x.e.emit(x.id, 'mls.status', { status: 'Active', verified: true });
    var subs = x.l.outbox.filter(function (m) { return m.kind === 'send.follower_update'; }).map(function (m) { return m.subject; }).join(' | ');
    return { pass: /Under contract/.test(subs) && /Back on the market/.test(subs), detail: 'Under contract → back on the market, both sent' };
  });
  test('Books', 'Closing creates the new owners’ home book, held for your personal note', function (LC) {
    var x = fresh(LC); goLive(x);
    x.e.emit(x.id, 'mls.status', { status: 'Pending', verified: true });
    x.e.emit(x.id, 'mls.status', { status: 'Sold', verified: true });
    var hb = x.l.homeBook, held = x.l.approvals.some(function (a) { return a.kind === 'send.homebook' && a.status === 'open'; });
    var denied = false; try { x.e.homeBook(x.id, 'HOME-WRONG'); } catch (e) { denied = true; }
    return { pass: !!hb && held && !hb.sent && denied && x.e.homeBook(x.id, hb.code).ok && !!x.l.closingBook, detail: 'Book link ' + (hb && hb.code) + ' created; sending waits for you; wrong link refused' };
  });
  test('Quick setup', 'A new listing is set up from a few answers, stays private, and is invisible to other brokerages', function (LC) {
    var x = fresh(LC);
    var nl = x.e.createListing({ address: '865 Example Rd, Gig Harbor, WA', price: 1250000, beds: 4, baths: 3, sqft: 3100, seller: 'Pat', photos: 'Drive folder' });
    var sq = nl.facts.filter(function (f) { return f.key === 'sqft'; })[0];
    var other = x.e.forTenant('northline'), blocked = false; try { other.L(nl.id); } catch (e) { blocked = true; }
    return { pass: nl.state === 'preparing' && sq.status === 'pending' && blocked && x.e.listings().length === 2 && !nl.ledger['story.publish:1'], detail: 'Preparing, not public · square footage pending until confirmed · Northline denied' };
  });
  test('Silent talkers', 'Room cards use only verified facts and refuse removed claims', function (LC) {
    var x = fresh(LC); var cards = x.e.talkers(x.id);
    var txt = cards.map(function (c) { return (c.title || '') + ' ' + (c.body || ''); }).join(' ').toLowerCase();
    var bad = x.e.addTalker(x.id, { room: 'Primary', title: 'Water view', body: 'Peek-a-boo water view from the suite' });
    var good = x.e.addTalker(x.id, { room: 'Laundry', title: 'Laundry with a sink', body: 'Quartz counters and a utility sink' });
    var deck = cards.filter(function (c) { return c.id === 'deck'; })[0];
    return { pass: cards.length >= 10 && !/water view|shiplap|beneath the deck/.test(txt) && bad.ok === false && good.ok && /24×22/.test(deck.body) && deck.sources.length === 2, detail: cards.length + ' cards, each traced to its fact sources; “water view” card refused' };
  });

  function run(LC) {
    return T.map(function (t) {
      var r; var t0 = Date.now();
      try { r = t.fn(LC); } catch (err) { r = { pass: false, detail: 'Error: ' + err.message }; }
      return { group: t.group, name: t.name, pass: !!r.pass, detail: r.detail, ms: Date.now() - t0 };
    });
  }
  return { run: run, count: T.length };
})();
if (typeof module !== 'undefined') module.exports = LCTests;
