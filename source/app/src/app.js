{
/* ============================================================
   LISTING CONCIERGE — EXPERIENCE LAYER
   Every view is a pure function of engine state → HTML.
   ============================================================ */
const ARTIFACT_URL = '__ARTIFACT_URL__';
const LID = 'L-19917';
const $app = document.getElementById('app');
const caps = { db: null, user: null, sample: null, downloads: null, mcp: null };
let DB, E, lastRoute = null, ui = { tone: null, oh: null, editing: null, qa: [], sqftSource: 'County record', tags: [], who: null };
let session = { seller: null, attribution: null, visitor: null };
try { session = Object.assign(session, JSON.parse(sessionStorage.getItem('lc.session') || '{}')); } catch (e) {}
if (!session.visitor) session.visitor = 'V' + Math.random().toString(36).slice(2, 10);
function keepSession() { try { sessionStorage.setItem('lc.session', JSON.stringify(session)); } catch (e) {} }

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const M = id => LC.MEDIA.find(m => m.id === id);
const webp = f => typeof PUBLIC_SITE !== 'undefined' && /\.jpg$/.test(f) ? ` src="${f.replace(/\.jpg$/, '.webp')}" srcset="${f.replace(/\.jpg$/, '-800.webp')} 800w, ${f.replace(/\.jpg$/, '.webp')} 1600w" sizes="(max-width: 760px) 100vw, 60vw"` : ` src="${f}"`;
const img = (id, cls, extra) => { const m = M(id); extra = extra || ''; return `<img class="${cls || ''}"${webp(m.file)} alt="${esc(m.alt)}" ${extra.indexOf('loading=') < 0 ? 'loading="lazy"' : ''} data-act="zoom" data-id="${m.id}" ${extra}>`; };
const L = () => E.L(LID);
const V = k => E.V(L(), k);
const T = () => E.T();
const when = t => new Date(t).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const ago = t => { if (!t) return '—'; const s = (Date.now() - t) / 1000; if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago'; return Math.floor(s / 86400) + 'd ago'; };
const day = t => new Date(t).toLocaleDateString('en-US', { weekday: 'short' });
const street = () => (V('address') || '').split(',')[0];
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
const PUBLIC = ['active', 'market_engagement', 'under_contract', 'coming_soon'];
const isStaff = () => typeof PUBLIC_SITE !== 'undefined' ? false : !caps.user ? true : (caps.user.isOwner() || caps.user.canEdit());
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3200); }
/* ---------- public site mode + lead delivery ---------- */
const SITE = typeof PUBLIC_SITE !== 'undefined' ? PUBLIC_SITE : null;
function contactFields(p) {
  return `<div class="field"><label for="${p}-n">Name</label><input id="${p}-n" name="name" required autocomplete="name"></div>
  <div class="field"><label for="${p}-p">Phone</label><input id="${p}-p" name="phone" type="tel" inputmode="tel" required autocomplete="tel" placeholder="(253) 555-0123"></div>
  <div class="field"><label for="${p}-e">Email</label><input id="${p}-e" name="email" type="email" required autocomplete="email"></div>`;
}
const honeypot = () => `<div class="hp" aria-hidden="true"><label>Leave this empty<input name="website" tabindex="-1" autocomplete="off"></label></div>`;
function readContact(f) {
  const name = f.elements.name.value.trim(), phone = f.elements.phone.value.trim(), email = f.elements.email.value.trim();
  if (phone.replace(/\D/g, '').length < 10) { toast('Please add a phone number with area code.'); f.elements.phone.focus(); return null; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { toast('Please add a valid email.'); f.elements.email.focus(); return null; }
  return { name, phone, email };
}
async function submitLead(f, type, data) {
  if (f.elements.website && f.elements.website.value) return false; // bots fill hidden fields
  if (!SITE || !SITE.api) return true; // inside claude.ai: recorded on The Desk only
  const b = f.querySelector('button:not([type=button])'), label = b ? b.textContent : '';
  if (b) { b.disabled = true; b.textContent = 'Sending…'; }
  try {
    const res = await fetch(SITE.api, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ type, page: SITE.page, listing: street(), source: session.attribution || 'direct' }, data)) });
    const j = await res.json();
    if (!j.ok) throw new Error(j.reason || 'Not sent');
    return true;
  } catch (e) {
    toast((e && e.message && e.message !== 'Failed to fetch' ? e.message : 'That didn’t go through.') + ' Please try again in a moment.');
    if (b) { b.disabled = false; b.textContent = label; }
    return false;
  }
}
function track(kind, data) { if (!SITE || !SITE.api) return; try { fetch(SITE.api, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ type: kind, page: SITE.page, listing: street(), source: session.attribution || 'direct', visitor: session.visitor }, data || {})), keepalive: true }).catch(() => {}); } catch (e) {} }
function shareUrl(code) { const base = SITE ? SITE.url : ARTIFACT_URL.indexOf('http') === 0 ? ARTIFACT_URL : location.href.split('#')[0]; return base + '#' + code; }
async function copy(text) { try { await navigator.clipboard.writeText(text); toast('Copied'); } catch (e) { sheet(`<h3>Copy this</h3><div class="field"><textarea readonly onfocus="this.select()">${esc(text)}</textarea></div>`); } }

/* ---------- state: database first, this browser as fallback ---------- */
let rev = 0, saving = false, dirty = false, remoteUnsub = null;
function boot(data) {
  DB = data || LC.seed();
  Object.values(DB.tenants).forEach(t => Object.values(t.listings).forEach(l => { l.runs = l.runs || []; }));
  E = LC.createEngine(DB, { now: () => Date.now() + (DB.clockOffset || 0), hooks: { change: () => { dirty = true; scheduleSave(); if (!render.q) { render.q = true; queueMicrotask(() => { render.q = false; render(); }); } } } });
  E.scanConflicts(LID);
  try { const l = E.L(LID), am = E.fact(l, 'amenities');
    if (am && /The Post café/.test(am.value) && !l.exceptions.some(x => x.type === 'research' && x.data && x.data.key === 'amenities'))
      E.raise(LID, 'research', '“The Post” is now Post & Pour', 'Tehaleh’s own site says the café building became Post & Pour in April 2024, and The Retreat clubhouse is planned for 2027. Your remarks still say “The Post café.”', { key: 'amenities', value: 'Post & Pour café and the planned Retreat clubhouse (opening 2027)', source: 'tehaleh.com (Apr 2024, Sept 2025) · confirmed by research' });
  } catch (e) {}
  try { E.tick(LID); } catch (e) {}
}
setInterval(() => { if (E) { try { E.tick(LID); } catch (e) {} } }, 60000);
function scheduleSave() { clearTimeout(scheduleSave.t); scheduleSave.t = setTimeout(save, 700); }
function trim(d) {
  const c = JSON.parse(JSON.stringify(d));
  Object.values(c.tenants).forEach(t => Object.values(t.listings).forEach(l => {
    l.audit = l.audit.slice(0, 220); l.events = l.events.slice(0, 120); l.outbox = l.outbox.slice(0, 160); l.visits = l.visits.slice(-900);
  }));
  return c;
}
async function save() {
  if (!dirty) return;
  dirty = false;
  const body = JSON.stringify(trim(DB));
  try { localStorage.setItem('lc.state', body); } catch (e) {}
  if (!caps.db || saving) { if (saving) dirty = true; return; }
  saving = true; rev = Date.now();
  try { await caps.db.doc('concierge/state').set({ json: body, rev: rev }); }
  catch (e) { if (e && e.code === 'invalid_argument') caps.db = null; }
  saving = false;
  if (dirty) scheduleSave();
  syncDrafts();
}
function loadLocal() { try { const s = localStorage.getItem('lc.state'); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
async function connect() {
  const got = await Promise.all(['user', 'sample', 'downloads', 'db', 'mcp'].map(n => claude.use(n).catch(() => null)));
  caps.user = got[0]; caps.sample = got[1]; caps.downloads = got[2]; caps.db = got[3]; caps.mcp = got[4];
  if (caps.db) {
    const timer = setTimeout(() => {}, 10000);
    remoteUnsub = caps.db.doc('concierge/state').onSnapshot(snap => {
      clearTimeout(timer);
      if (!snap.exists) { dirty = true; scheduleSave(); return; }
      const d = snap.data();
      if (snap.metadata.hasPendingWrites || d.rev === rev) return;
      try { rev = d.rev; const parsed = JSON.parse(d.json); if (parsed && parsed.v === 3) { boot(parsed); render(); } } catch (e) {}
    }, () => { clearTimeout(timer); });
  }
  render();
}

/* ============================================================
   CONNECTIONS — your own connectors, called with your own sign-in
   ============================================================ */
const DRIVE_FOLDER = '1qBHJvrWKuWVllv-gFdT-FKr5JJuLTmA1';
const settings = () => (DB.settings = DB.settings || { gmail: 'off' });
const conn = () => (DB.connections = DB.connections || {});
function payloadOf(r) { let p = r && (r.payload !== undefined ? r.payload : r); if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) {} } if (p && p.content && Array.isArray(p.content)) { const t = p.content.find(c => c.type === 'text'); if (t) { try { p = JSON.parse(t.text); } catch (e) { p = t.text; } } } return p; }
async function callTool(server, tool, input) { if (!caps.mcp) throw { code: 'unavailable', message: 'Connections aren’t available in this view.' }; return payloadOf(await caps.mcp.callTool(server, tool, input)); }
async function checkDrive() {
  ui.busy = 'drive'; render();
  try {
    let files = [], token = null, pages = 0;
    do { const p = await callTool('Google Drive', 'search_files', Object.assign({ query: `parentId = '${DRIVE_FOLDER}' and mimeType contains 'image/'`, pageSize: 100, excludeContentSnippets: true }, token ? { pageToken: token } : {}));
      files = files.concat((p && p.files) || []); token = p && p.nextPageToken; pages++; } while (token && pages < 20);
    const used = new Set(LC.MEDIA.map(m => m.seq));
    const unused = files.filter(f => { const n = parseInt(String(f.title || '').split('-')[0], 10); return !used.has(n); }).map(f => f.title);
    conn().drive = { at: Date.now(), count: files.length, used: LC.MEDIA.length, unused: unused.slice(0, 20) };
    toast(files.length + ' photos in the Drive folder · ' + LC.MEDIA.length + ' in the story');
  } catch (e) { conn().drive = { at: Date.now(), error: (e && (e.message || e.code)) || 'Could not reach Google Drive' }; }
  ui.busy = null; dirty = true; scheduleSave(); render();
}
async function checkMetricool() {
  ui.busy = 'metricool'; render();
  try { const p = await callTool('Metricool Social Media Management', 'getBrandSettings', {}); const list = Array.isArray(p) ? p : (p && (p.brands || p.data)) || [];
    conn().metricool = { at: Date.now(), brands: list.length || (p ? 1 : 0) }; }
  catch (e) { conn().metricool = { at: Date.now(), error: (e && (e.message || e.code)) || 'Could not reach Metricool' }; }
  ui.busy = null; dirty = true; scheduleSave(); render();
}
let drafting = false;
async function syncDrafts() {
  const st = settings(), seller = L().sellers[0];
  if (st.gmail !== 'drafts' || !seller.email || !caps.mcp || drafting) return;
  const todo = L().outbox.filter(m => !m.gmail && m.at >= (st.gmailSince || 0) && (m.to === 'Seller' || m.kind === 'send.seller_live' || m.kind === 'send.seller_report')).slice(0, 3);
  if (!todo.length) return;
  drafting = true;
  for (const m of todo) {
    try { const p = await callTool('Gmail', 'create_draft', { to: [seller.email], subject: m.subject + ' · ' + street(), body: m.body + '\n\n— ' + T().agent.name, includeSignature: true });
      m.gmail = { id: p && p.id, url: p && p.viewUrl }; }
    catch (e) { m.gmail = { error: (e && (e.message || e.code)) || 'Draft failed' }; }
  }
  drafting = false; dirty = true; scheduleSave(); render();
}

/* ============================================================
   PROPERTY STORY (public)
   ============================================================ */
function story() {
  const l = L(), a = E.assets(LID), t = T(), mode = l.mode || 'editorial';
  const live = PUBLIC.indexOf(l.state) >= 0;
  const pending = l.state === 'under_contract';
  const oh = l.openHouses.find(o => o.status === 'scheduled');
  const beds = E.fact(l, 'beds');
  const ch = n => LC.MEDIA.filter(m => m.chapter === n);
  const ribbon = !live ? `<div class="ribbon">Private preview — this story goes public only after a verified NWMLS activation.</div>`
    : session.attribution === 'qr' && oh ? `<div class="ribbon">Welcome to the open house. <button class="btn text" style="color:#fff" data-act="oh-signin">Sign in (optional)</button></div>`
    : session.attribution === 'qr' ? `<div class="ribbon">Welcome — you scanned our sign. Browse freely; we only ask for details if you ask us for something.</div>` : '';
  return `<div class="story m-${mode}">
  ${ribbon}
  <header class="hero">
    <div class="topnav"><div class="mark"><span class="st">${esc(street())}</span><span class="ct">${esc((V('address') || '').split(',').slice(1).join(',').trim())}</span></div>
      <div class="tn"><a class="cta" href="#story" data-act="tour">Request a Tour</a><button class="menu" data-act="menu" aria-expanded="${!!ui.menu}" aria-controls="drop">Menu</button></div>
      ${ui.menu ? `<nav class="drop" id="drop" aria-label="Menu"><a href="#story" data-scroll="s-story">The Story</a><a href="#story" data-scroll="s-home">The Home &amp; Photos</a><a href="${SITE ? SITE.guideUrl : '#tehaleh'}" ${SITE ? '' : 'data-act="menu-go"'}>Life in Tehaleh</a>${SITE ? `<a href="#valuation" data-act="menu-go">What’s my home worth?</a>` : `<a href="#following" data-act="menu-go">My homes</a>
        <span class="sep2"></span><a href="#seller" data-act="menu-go"><span>Sellers</span><span class="small">Your private portal</span></a><a href="#desk" data-act="menu-go"><span>Agents</span><span class="small">The Desk</span></a>`}</nav>` : ''}</div>
    <div class="photo">${img(l.heroPhoto || 'great-room', '', 'fetchpriority="high" loading="eager"')}</div><div class="scrim"></div>
    <div class="copy"><h1><span class="h1k">${esc(street())} · ${esc(V('community'))}, Bonney Lake, WA 98391</span>${esc(a.headline)}</h1>
      <div class="meta">${pending ? '<span class="tag" style="color:#E7D7BF">Pending</span>' : ''}<span class="price">${V('price') != null ? LC.money(V('price')) : ''}</span><span>${V('beds')} Bedrooms*</span><span>${V('baths')} Baths</span>${V('sqft') ? `<span>${Number(V('sqft')).toLocaleString()} sq ft</span>` : ''}<span>Backs to greenbelt</span></div></div>
  </header>
  <section class="lede narrow"><div class="eyebrow">${esc(street())}</div>
    <p class="big" style="margin-top:26px">Over $100K in upgrades, designer interiors, generous outdoor living and a peaceful greenbelt setting — in the heart of Tehaleh.</p>
    <div class="acts"><button class="btn" data-scroll="s-story">Explore the Story</button><button class="btn ghost" data-act="tour">Request a Private Tour</button></div></section>

  <section class="chapter wrap" id="s-story"><div class="head"><span class="n">01</span><h2>A Home That Feels Different</h2></div>
    <div class="duo">${img('kitchen-island', 'ph t')}<div class="stackcol">${img('great-room2', 'ph m')}
      <div><p class="prose" style="margin:6px 0 14px">${esc(V('great_room'))} opens to a kitchen with ${esc((V('kitchen') || '').toLowerCase())}. ${esc(V('character'))} add character throughout.</p>
      <p class="small muted" style="margin:0">${esc(V('main_floor'))}</p></div></div></div></section>

  <div class="dark"><section class="chapter wrap"><div class="head"><span class="n">02</span><h2>Mornings With a View</h2></div>
    <div class="duo"><div>${img('rainier-view2', 'ph t')}<div class="cap">Photographed from upstairs · Mount Rainier</div></div>
    <div class="stackcol"><p class="serif" style="font-size:clamp(22px,2.2vw,28px);line-height:1.4;margin:0">The primary suite and two more bedrooms capture Mount Rainier. The fourth looks out over the greenbelt.</p>
      ${img('primary-bed2', 'ph m')}<div class="duo" style="grid-template-columns:1fr 1fr">${img('primary-bath2', 'ph s')}${img('primary-closet', 'ph s')}</div>
      <p class="prose" style="margin:0">${esc(V('primary'))}. ${esc(V('fourth_bedroom'))}.</p></div></div></section></div>

  <section class="full">${img('deck-fire', '')}<div class="scrim"></div><div class="inner wrap"><span class="serif" style="color:#D9C2A0">03</span><h2>Room to Unwind</h2>
    <p class="prose" style="color:inherit;max-width:44ch">${esc(V('deck'))}. ${esc(V('lot'))}.</p></div></section>
  <section class="wrap" style="padding:24px 0 clamp(80px,10vw,140px)"><div class="duo" style="padding:0 clamp(20px,4vw,48px)">${img('covered-deck', 'ph m')}${img('greenbelt-yard', 'ph m')}</div></section>

  <section class="chapter wrap" id="s-hood"><div class="head"><span class="n">04</span><h2>Life Beyond the Front Door</h2></div>
    ${img('aerial-mountains', 'ph t')}
    <div class="stats"><div><div class="v">40+</div><div class="k">miles of Tehaleh trails</div></div><div><div class="v">18</div><div class="k">community parks</div></div>
      <div><div class="v" style="font-size:clamp(26px,2.6vw,32px)">${/Post & Pour/.test(V('amenities') || '') ? 'Post &amp; Pour' : 'The Post'}</div><div class="k">neighborhood café</div></div><div><div class="v" style="font-size:clamp(26px,2.6vw,32px)">The Retreat</div><div class="k">clubhouse, planned for 2027</div></div></div>
    <p class="muted small" style="margin-top:28px">${esc(V('nearby'))} nearby · ${esc(V('school_district'))}</p>
    <a class="btn ghost" href="${SITE ? SITE.guideUrl : '#tehaleh'}" style="margin-top:28px">Explore life in Tehaleh <span aria-hidden="true">→</span></a></section>

  <section style="background:var(--soft)" id="s-home"><div class="wrap" style="padding-top:clamp(72px,9vw,120px);padding-bottom:clamp(72px,9vw,120px)">
    <h2 class="serif" style="font-size:clamp(32px,4vw,52px);margin:0 0 8px">Explore the Home</h2>
    <p class="muted" style="margin:0 0 40px">Every detail below comes from one verified record. Correct it once and it updates everywhere.</p>
    <div class="specs">
      <div><div class="k">Price</div><div class="v">${LC.money(V('price'))}</div></div>
      <div><div class="k">Bedrooms</div><div class="v">${V('beds')}*</div><div class="n">*${esc(beds.note)}</div></div>
      <div><div class="k">Baths</div><div class="v">${V('baths')}</div></div>
      ${V('sqft') ? `<div><div class="k">Interior</div><div class="v">${Number(V('sqft')).toLocaleString()} sq ft</div></div>` : ''}
      <div><div class="k">Upper level</div><div class="v p">${esc(V('upper'))}</div></div>
      <div><div class="k">Outdoor living</div><div class="v p">${esc(V('deck'))}; ${esc((V('storage') || '').toLowerCase())}</div></div>
      <div><div class="k">Comfort &amp; tech</div><div class="v p">${esc(V('systems'))}</div></div>
      <div><div class="k">Garage</div><div class="v p">${esc(V('garage'))}</div></div>
      <div><div class="k">Schools</div><div class="v p">${esc(V('school_district'))}</div></div>
    </div>
    <h3 class="serif" style="font-size:28px;margin:64px 0 20px">Every photograph</h3>
    <div class="gallery">${LC.MEDIA.map(m => `<button data-act="zoom" data-id="${m.id}" aria-label="Open photo: ${esc(m.alt)}"><img src="${m.thumb}" alt="" loading="lazy"></button>`).join('')}</div>
  </div></section>

  <section class="wrap" style="padding-top:clamp(72px,9vw,120px);padding-bottom:clamp(72px,9vw,120px)"><div class="next">
    <div class="panel"><div class="eyebrow">Take the next step</div><h3>See it in person.</h3><div class="stack">
      <button class="btn light wide" data-act="tour">Request a private tour</button>
      ${oh ? `<button class="btn line wide" data-act="oh-register">Open house · ${esc(oh.label || '')}</button>` : ''}
      <button class="btn line wide" data-act="follow">♡ Follow this home</button>
      <button class="btn line wide" data-act="ask" data-from="buyer">Ask about this home</button></div>
      <p class="small" style="color:#B9B2A6;margin:18px 0 0">Browse everything freely. We only ask for your details when you ask us for something.</p></div>
    <div class="stackcol"><a class="card" href="#valuation"><span class="eyebrow">Discover more</span><span class="t">Curious what yours is worth?</span><span class="muted">A private valuation from the team marketing this home.</span></a>
      <a class="card" href="#home-edit" style="flex-direction:row;align-items:center;gap:18px"><img src="${M('bedroom-green').thumb}" alt="" style="width:120px;height:96px;object-fit:cover;flex:none"><span style="display:flex;flex-direction:column;gap:6px"><span class="eyebrow">The Home Edit</span><span class="t" style="font-size:21px">Love the look? Meet the people who can bring it home.</span></span></a></div>
  </div></section>
  ${faqBlock('Questions about ' + street(), homeFaq())}
  ${footer()}
  <div class="mbar"><button class="btn light" style="flex:1" data-act="tour">Request a Tour</button>
    <button class="btn line ic" data-act="follow" aria-label="Follow this home"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button>
    <button class="btn line ic" data-act="share-public" aria-label="Share this home"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 3v13M7 8l5-5 5 5M5 14v6h14v-6"/></svg></button>
    <button class="btn line ic" data-act="ask" data-from="buyer" aria-label="Ask about this home"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg></button></div>
</div>`;
}
function footer() {
  const t = T();
  return `<footer class="foot"><div class="wrap"><div class="brands"><span class="b1">${esc(t.name.toUpperCase())}</span><span class="sep"></span><span class="b2">${esc(t.affiliation)}</span></div>
  <div class="small" style="max-width:420px;line-height:1.7">${SITE ? `<a href="https://www.ranchpnw.com" rel="noopener">RanchPNW.com</a> · <a href="${GBP_URL}" rel="noopener" target="_blank">Our Google reviews</a> · <a href="${SITE.guideUrl}/">Life in Tehaleh</a><br>` : ''}Brand marks shown as text pending approved brand files. ${esc(t.disclaimer)}</div></div></footer>`;
}

/* ---------- Place records: neighborhoods as reusable, sourced guides ---------- */
const SRC = {
  parks: ['tehaleh.com · Parks & Trails', 'https://www.tehaleh.com/discovery-park'],
  plans: ['tehaleh.com · Future plans', 'https://tehaleh.com/future-plans'],
  retreat: ['tehaleh.com · The Retreat (Sept 2025)', 'https://www.tehaleh.com/life-at-tehaleh/blog/posts-by-date/2025/september/construction-begins-on-the-retreat-at-glacier-pointe/'],
  pour: ['tehaleh.com · Post & Pour (Apr 2024)', 'https://www.tehaleh.com/life-at-tehaleh/blog/posts-by-date/2024/march/post-pour-a-new-and-exciting-hub-for-tehaleh/'],
  faq: ['tehaleh.com · FAQ', 'https://www.tehaleh.com/faq'],
  schools: ['tehaleh.com · Schools', 'https://www.tehaleh.com/schools/schools-k-12'],
  heights: ['tehaleh.com · Meet Tehaleh Heights (2019)', 'https://www.tehaleh.com/life-at-tehaleh/blog/posts-by-date/2019/april/meet-tehaleh-heights-elementary-school'],
  msbond: ['sumnersd.org · New middle school in Tehaleh', 'https://www.sumnersd.org/about-us/overview/construction/2024-bond-projects/new-middle-school-in-tehaleh'],
  costco: ['costco.com · Bonney Lake warehouse', 'https://costco.com/warehouse-locations/bonney-lake-wa-1278.html'],
  ayp: ['City of Bonney Lake · Parks', 'https://bonneylake.hosted.civiclive.com/Government/departments/Public_Services/Public_Works/Parks_Trails'],
  boating: ['City of Bonney Lake · Boating', 'https://bonneylake.hosted.civiclive.com/residents/community/boating'],
  nltp: ['Pierce County · North Lake Tapps Park', 'https://www.piercecountywa.gov/LakeTapps'],
  community: ['tehaleh.com · Our community', 'https://www.tehaleh.com/community/'],
  future: ['tehaleh.com · Future plans', 'https://www.tehaleh.com/future-plans/'],
  wiki: ['Wikipedia · Tehaleh, Washington', 'https://en.wikipedia.org/wiki/Tehaleh,_Washington'],
  tnt: ['The News Tribune · Post & Pour', 'https://www.yahoo.com/news/pierce-county-bistro-view-mount-183911636.html'],
  ppsite: ['postandpour.com', 'https://www.postandpour.com/'],
  mantel: ['Trilogy at Tehaleh · The Mantel', 'https://www.mytrilogylife.com/tehaleh/dining/']
};
// Community photography (Tehaleh's own, from the team's Drive) — shown with credit, kept apart from the listing's photo record
const PLACE_MEDIA = {
  'teh-rainier-boulevard': ['photos/teh-rainier-boulevard.jpg', 'A tree-lined Tehaleh boulevard leading straight toward Mount Rainier', 'Tehaleh'],
  'teh-rainier-autumn': ['photos/teh-rainier-autumn.jpg', 'Autumn color along a Tehaleh parkway with Mount Rainier ahead', 'Tehaleh'],
  'teh-trail-ferns': ['photos/teh-trail-ferns.jpg', 'A paved Tehaleh trail winding through ferns and old trees', 'Tehaleh'],
  'teh-sticks-stones': ['photos/teh-sticks-stones.jpg', 'Sticks ’n’ Stones park: boulders, lawn and forest edge', 'Tehaleh'],
  'teh-postpour-firepit': ['photos/teh-postpour-firepit.jpg', 'Fire pit and Adirondack chairs on the Post & Pour patio on a snowy morning, Mount Rainier straight ahead', 'by Chris Ranch', '50% 30%'],
  'teh-trail-postpour': ['photos/teh-trail-postpour.jpg', 'View from the trail toward Post & Pour, with Mount Rainier rising behind the roof', 'by Chris Ranch', '50% 58%']
};
const pimg = (id, cls, extra) => PLACE_MEDIA[id] ? `<figure class="pfig ${cls || ''}"><img${PLACE_MEDIA[id][3] ? ` style="object-position:${PLACE_MEDIA[id][3]}"` : ''}${webp(PLACE_MEDIA[id][0])} alt="${esc(PLACE_MEDIA[id][1])}" loading="${(extra || '').indexOf('eager') >= 0 ? 'eager' : 'lazy'}"><figcaption>${/^by /.test(PLACE_MEDIA[id][2]) ? 'Photo ' + PLACE_MEDIA[id][2] : 'Photo courtesy of ' + PLACE_MEDIA[id][2]}</figcaption></figure>` : img(id, cls, extra);
const PLACES = {
  'bonney-lake': { name: 'Bonney Lake', parent: 'Pierce County, Washington' },
  tehaleh: { name: 'Tehaleh', parent: 'bonney-lake', checked: '2026-11-19', hero: 'teh-rainier-boulevard',
    headline: 'Where the forest is the neighborhood.',
    lede: 'A planned community on a forested plateau south of Bonney Lake — built around trails, parks and a front-row view of Mount Rainier. Here is what life here actually looks like, from the morning coffee to the weekend on the lake.',
    stats: [['40+', 'miles of trails', 'parks'], ['18', 'parks, and counting', 'parks'], ['25 mi', 'to Mount Rainier National Park’s Carbon River entrance', 'faq'], ['2027', 'The Retreat clubhouse opens', 'retreat']],
    notes: ['One Tehaleh article from June 2026 counts 17 parks; the community’s Parks & Trails page lists 18. We show the page’s figure and re-check monthly.'],
    chapters: [
      { t: 'The mountain, every day', photo: 'teh-rainier-autumn', dark: true,
        intro: 'Tehaleh sits on a plateau several hundred feet above the Puyallup River valley, and its boulevards were laid out to aim at the mountain. On a clear morning, Mount Rainier fills the end of the street — and from this home, the primary suite and two more bedrooms.',
        items: [['Forest first', 'Neighborhoods are tucked between preserved stands of evergreens, so trails start a few steps from most front doors.', 'parks'], ['Room to grow', 'Planned as a complete community, with land set aside for schools, parks and a commercial village as it builds out.', 'plans']] },
      { picks: true, t: 'From someone who lived here',
        intro: 'I used to live in Tehaleh, and I still sell here often. These are the places I send everyone.',
        items: [['Post & Pour', 'My favorite spot in the neighborhood — with an incredible view of Mount Rainier. When we lived here, one of our favorite things was to walk the trail to the Post, grab a coffee, a glass of wine or a bite, hang out while the kids played, then take the trail back home. Several fire-pit patios, events most seasons, and it’s where neighbors turn into friends.', 'teh-postpour-firepit'],
          ['The trails, as a run', 'Forty-plus miles, and the part people don’t realize until they live here: they all connect. It’s one giant, intertwined loop, so you can run for miles without retracing a step — or just head out the door and see where it takes you.', 'teh-trail-ferns'],
          ['Hounds Hollow', 'A great dog park. Separate areas, room to run, agility features and a place for owners to sit. If you have a dog, you’ll be here a lot.', ''],
          ['Honestly, every park', 'They’re all good. Each one is built around something different — a zip line, a tree fort, boulders, a pond — so a weekend can be a different park every day.', 'teh-sticks-stones']] },
      { day: true, t: 'A day in the life', kicker: 'A Saturday in Tehaleh, the way we lived it',
        intro: 'Wake up, get the kids ready, grab the dog — and bundle up if it’s fall or winter. Here’s what an ordinary Saturday looked like for our family.',
        moments: [
          ['Morning', 'Out the door, onto the trail', 'There’s trail access on nearly every street, or within a block. You don’t drive to the outdoors here; you step into it.', 'teh-trail-ferns', 'parks'],
          ['First stop', 'Hounds Hollow', 'We’d start at the trail by Hounds Hollow so the dog could run off some energy at the off-leash park, then keep walking through.', '', 'parks'],
          ['The walk over', 'The activity trail to the Post', 'A fun activity trail leads right to Post & Pour, which looks straight out at Mount Rainier — one of the best photos in the neighborhood. It was about a 15-minute walk for us. Tehaleh is big, so from farther neighborhoods you might bike, or drive if time is short.', 'teh-trail-postpour', 'tnt'],
          ['Mid-morning', 'Coffee, and everyone you know', 'When you get to Post & Pour there are people everywhere — friends, and neighbors who became friends. Coffee or a glass of wine, flatbread or pretzels, the kids playing nearby. The fire pits run during the day too: on a gray winter morning, or a crisp one with the mountain out, a fire and a warm coffee is hard to beat.', 'teh-postpour-firepit', 'ppsite'],
          ['Weekdays', 'Walking to school with friends', 'Our kids went to Tehaleh Heights Elementary, the STEM school right in the neighborhood. They walked there and back with their friends every day — the thing they loved most.', '', 'heights'],
          ['October', 'Halloween like it used to be', 'Tehaleh does Halloween the way you remember it from the early ’90s: kids everywhere, and blocks and blocks of homes decked out. Not every house, but you can walk for miles and keep finding great ones.', '', ''],
          ['Evening', 'Fire pits, or The Mantel', 'Evenings often meant the fire pits at Post & Pour again. We were also members at The Mantel, the private restaurant in Trilogy’s Seven Summits Lodge — great food, great service, a really cool room. It takes a dining membership, and Trilogy has had a waitlist for those.', '', 'mantel']],
        honest: [['What people don’t realize until they live here', 'You may not need a huge yard. The common areas, parks and trails do so much of that work. Even people who don’t love HOAs tend to find Tehaleh makes the dues worth it — trail maintenance is quick, a downed tree gets handled fast when you report it, and the place stays beautiful.'],
          ['Who Tehaleh isn’t for', 'If you want a really large lot, there are only a few here, and reaching them means driving past hundreds of homes. Worth weighing before you fall in love with the trails.']] },
      { t: 'The Retreat at Glacier Pointe', photo: 'clubhouse-aerial3', kicker: 'Opening 2027 · under construction since September 2025',
        intro: 'Tehaleh’s new heart: a resident clubhouse campus facing Mount Rainier, designed for the everyday — a workout before work, pickleball after, coffee with a neighbor, a party on the lawn.',
        feature: [['8,300+ sq ft', 'clubhouse for gatherings, events and the community-life team'], ['5,773 sq ft', 'fitness center with wellness spaces'], ['2 courts', 'pickleball, with a 1,218 sq ft lounge, TVs and seating'], ['Café', 'with a full kitchen and bar'], ['The lawn', 'yard games and seating with Mount Rainier views']],
        items: [['For residents', 'Tehaleh describes the clubhouse as community-exclusive. It will also be the one stop for mail keys, event reservations and HOA questions.', 'retreat'], ['What’s next to it', 'Two retail parcels beside The Retreat are set aside for shops overlooking the green.', 'retreat']],
        note: 'Tehaleh’s announcement lists the clubhouse at 8,337 sq ft; the site sign says 8,377. Plans and renderings can change before opening.', photo2: 'clubhouse-sign' },
      { t: 'Coffee, a pint, and the neighbors', photo: 'teh-postpour-firepit',
        intro: 'Every neighborhood needs its living room. In Tehaleh it’s been the same building for more than a decade — now under new local owners.',
        items: [['Post & Pour', 'Café by morning, bistro and taphouse later: local coffee, beer and wine, an incredible view of Mount Rainier, and several fire-pit patios for long evenings outside. The trails lead right to it. A calendar of seasonal gatherings like wine-and-yoga on the lawn and a book club, plus trail packs for people heading out for the day.', 'pour'], ['Tehaleh Welcome Center', 'Start a visit here. Pick up a Parktivity Passport and collect a badge sticker at each park — kids love it, and it’s the fastest way to learn the place.', 'parks']] },
      { t: 'Forty miles of trail', photo: 'teh-trail-ferns', dark: true,
        intro: 'The trails are the reason many people move here. More than forty miles of shaded path, and they all connect — one giant, intertwined loop through forest, ponds and meadows. A morning run, a long loop, a slow walk with the stroller.',
        items: [['The Trails of Tehaleh', 'Shaded, multi-use paths and quiet nature routes through the “Neighborwoods.”', 'parks'], ['The Trek Bike Park', 'Seventeen trails, a pump track and technical terrain — billed by Tehaleh as Washington’s first fully adaptive-mountain-bike-accessible, fully signed trail system.', 'parks'], ['Forest Park & Knoll Park', 'Woodland loops over rolling terrain, with shaded places to sit.', 'parks'], ['Yonder Park & Ponder Park', 'Wetland and pond views, open meadow, birdwatching, waterside seating and local art.', 'parks'], ['Reflection Park', 'Walking paths with fitness stations, a little free library and a game table.', 'parks']] },
      { t: 'Where kids run', photo: 'teh-sticks-stones',
        intro: 'Playgrounds here are designed by age and by landscape, so there’s a right one for a toddler, a seven-year-old and a twelve-year-old — usually within a walk.',
        grid: [['Sprouts Holler', '2–6', 'Toddler-scale and stroller-friendly, with shaded benches.'], ['Boulder Dash', '2–7', 'Climbable boulders, grass and picnic seating.'], ['Hawk’s Landing', '2–12', 'An elevated climbing structure, slides and swings.'], ['Skyline Park', '2–12', 'Mountain views and swings for every age, including an adaptive swing.'], ['Big Sky Park', '3–10', 'A zip line, bocce and a T-Rex rib climb.'], ['Expedition Grove', '3–10', 'A climbing tree fort in the forest, beside the trail.'], ['Sticks ’n’ Stones', '4–12', 'Boulder and log play with forest views.'], ['Infinity Park', '5–12', 'Play, a gathering space and a scenic outlook.'], ['Ruff ’N’ Tumble', '2–13', 'Three Ninja-Warrior-style obstacle courses.'], ['Discovery Park', 'All ages', 'Fifteen open acres: fields, bocce, a picnic shelter, a community garden and event space.'], ['The Edge', 'Teens', 'Skate park, half court and a graffiti wall.']], src: 'parks' },
      { t: 'With your dog', photo: 'greenbelt-yard', dark: true,
        intro: 'Dogs are part of the plan here — and this home backs right onto the greenbelt.',
        items: [['Hounds Hollow', 'Off-leash play with separate areas, agility features and seating for owners.', 'parks'], ['Ruff ’N’ Tumble dog parks', 'Two turf dog parks with room to run, next to the kids’ ninja courses.', 'parks']] },
      { t: 'Schools', photo: 'aerial-pin',
        intro: 'Tehaleh is served by two districts. This home is in the Sumner-Bonney Lake School District.',
        items: [['Sumner-Bonney Lake School District', 'Schools serving Tehaleh include Donald Eismann Elementary, Tehaleh Heights Elementary, Mountain View Middle School and Bonney Lake High School.', 'schools'], ['Tehaleh Heights Elementary', 'Opened in September 2018 as the district’s ninth elementary school, with STEM learning built into the program.', 'heights'], ['A new middle school in Tehaleh', 'Approved by voters in the November 2024 bond and now in design, to relieve crowding districtwide.', 'msbond'], ['Orting School District', 'Part of Tehaleh is assigned to Orting schools, including Orting High School.', 'schools']],
        note: 'School attendance is set by each district, not by Tehaleh. Confirm the assignment for any address directly with the district.' },
      { t: 'Beyond the front gate', photo: 'aerial-mountains', dark: true,
        intro: 'Tehaleh feels tucked away, but everyday errands are close and the big outdoors is closer.',
        items: [['Costco Bonney Lake', 'About 12 minutes away at 9801 204th Ave E, with gas and a tire center. Target and everyday shopping line Bonney Lake’s main corridor along SR-410.', 'costco'], ['Allan Yorke Park, Lake Tapps', 'Bonney Lake’s biggest park: 45 acres on the south end of Lake Tapps with a swim area, ballfields, a skate park, tennis, and the summer Tunes @ Tapps concerts and Bonney Lake Days.', 'ayp'], ['North Lake Tapps Park', 'A 135-acre county park with about 10,000 feet of shoreline and a sandy swimming area. Boat launches on the lake are by resident pass or reservation — check before you tow.', 'nltp'], ['Mount Rainier National Park', 'The Carbon River entrance is about 25 miles away; SR-410 also heads toward Crystal Mountain.', 'faq'], ['Getting to the city', 'About 21 miles to Tacoma, 43 to Seattle and 35 to Sea-Tac. Transit riders use the Bonney Lake Park-and-Ride and the Sounder train from Sumner.', 'faq']] }
    ],
    updated: '2026-11-19',
    glance: [['Where', 'On a forested plateau immediately south of Bonney Lake, in Pierce County, Washington (ZIP 98391)', 'community'], ['Size', 'About 4,700 acres, with more than 1,800 acres planned as parks, trails and open space', 'community'],
      ['Homes', 'Up to 9,700 homes planned at full build-out', 'future'], ['Owner', 'Brookfield Properties', 'community'], ['Trails & parks', '40+ miles of connected trails and 18 parks', 'parks'],
      ['Clubhouse', 'The Retreat at Glacier Pointe, planned to open in 2027', 'retreat'], ['Schools', 'Split between the Sumner-Bonney Lake and Orting school districts', 'future'],
      ['Distances', 'About 21 miles to Tacoma, 43 to Seattle, 35 to Sea-Tac and 25 to Mount Rainier National Park’s Carbon River entrance', 'faq'], ['Say it', 'TAY-ha-lay', 'community']],
    faq: [
      ['What is Tehaleh?', 'Tehaleh is a master-planned community of about 4,700 acres immediately south of Bonney Lake, Washington, where South Puget Sound meets the Cascade foothills. It is built around more than 40 miles of trails, 18 parks and views of Mount Rainier, and is owned by Brookfield Properties. It was formerly known as Cascadia.', 'community'],
      ['How do you pronounce Tehaleh?', 'TAY-ha-lay.', 'community'],
      ['How many miles of trails does Tehaleh have?', 'More than 40 miles, and they connect into one large network — you can walk or run for miles without retracing your route. Tehaleh also has 18 parks, including the Trek Bike Park with 17 mountain-bike trails.', 'parks'],
      ['What is The Retreat at Glacier Pointe, and when does it open?', 'The Retreat is Tehaleh’s new resident clubhouse campus, planned to open in 2027. Plans include a clubhouse of about 8,300 square feet, a 5,773 sq ft fitness center, two pickleball courts with a lounge, a café with a full kitchen and bar, and a lawn with Mount Rainier views.', 'retreat'],
      ['What is Post & Pour?', 'Post & Pour is Tehaleh’s café, bistro and taphouse — coffee in the morning, food, beer and wine later — with fire-pit patios, a Mount Rainier view and seasonal community events. The trails lead right to it.', 'pour'],
      ['What school district is Tehaleh in?', 'Tehaleh is split between the Sumner-Bonney Lake and Orting school districts. Schools serving Tehaleh include Donald Eismann Elementary, Tehaleh Heights Elementary, Mountain View Middle School and Bonney Lake High School, and a new middle school in Tehaleh was approved in the November 2024 bond. Confirm the assignment for a specific address with the district.', 'schools'],
      ['Is there a Costco near Tehaleh?', 'Yes. The Bonney Lake Costco at 9801 204th Ave E is about 12 minutes away, with everyday shopping along Bonney Lake’s SR-410 corridor.', 'costco'],
      ['How far is Tehaleh from Seattle and Tacoma?', 'About 21 miles from Tacoma, 43 miles from Seattle and 35 miles from Sea-Tac Airport. Transit riders use the Bonney Lake Park-and-Ride, about 5 miles north, and the Sounder train from Sumner.', 'faq'],
      ['Is Tehaleh dog-friendly?', 'Very. Hounds Hollow is an off-leash dog park with separate areas and agility features, and Ruff ’N’ Tumble has two turf dog parks.', 'parks'],
      ['Do you need a big yard in Tehaleh?', 'Often not. The common areas, 18 parks and 40+ miles of trails do much of what a big yard would. If you do want a large lot, there are only a few in Tehaleh, and reaching them means driving past hundreds of homes.', 'parks'],
      ['Is the Tehaleh HOA worth it?', 'In our experience living there, yes — trails are maintained quickly, a downed tree gets handled fast when reported, and the community stays beautiful. Review the current HOA documents and dues for any home you consider.', ''],
      ['Is Tehaleh good for families with kids?', 'It’s one of its strengths: kids walk to school with friends (Tehaleh Heights Elementary is right in the neighborhood), there are playgrounds for every age, and Halloween is famous — blocks and miles of decorated homes and kids everywhere.', 'heights'],
      ['Is Tehaleh close to Lake Tapps and Mount Rainier?', 'Yes. Lake Tapps is just north of Bonney Lake, with swimming at Allan Yorke Park and North Lake Tapps Park, and Mount Rainier National Park’s Carbon River entrance is about 25 miles away.', 'ayp']],
    fine: 'Places are described, never the people who live there. Distances are approximate. Plans for future amenities, schools and retail can change.'
  }
};
function faqBlock(title, items) {
  return `<section class="faq" id="faq"><div class="narrow"><h2 class="serif">${esc(title)}</h2>${items.map(([q, a, s]) => `<div class="qa-item"><h3>${esc(q)}</h3><p>${esc(a)}</p>${s ? srcLink(s) : ''}</div>`).join('')}</div></section>`;
}
function homeFaq() {
  const l = L(), v = k => V(k), adr = v('address') || '', z = '98391';
  const out = [[`How much is ${street()} listed for?`, `${street()} in Tehaleh is listed at ${LC.money(v('price'))}.`]];
  out.push([`How many bedrooms and bathrooms does ${street()} have?`, `Five bedrooms and 2.75 baths. The main-floor fifth bedroom is an office with no closet, beside a ¾ bath.`]);
  out.push([`Does ${street()} have a Mount Rainier view?`, `Yes. Mount Rainier is visible from the primary suite and two more bedrooms; the fourth bedroom looks out over the greenbelt.`]);
  out.push([`Does the home have air conditioning?`, `Yes — central air conditioning, plus Cat-6 wiring and an EV charger.`]);
  out.push([`What is the outdoor space like?`, `${v('deck')}, with ${(v('storage') || '').toLowerCase()}. ${v('lot')}.`]);
  out.push([`What school district is ${street()} in?`, `${v('school_district')}. Confirm school assignments with the district.`]);
  out.push([`What neighborhood is ${street()} in?`, `Tehaleh, the master-planned community just south of Bonney Lake, Washington ${z} — known for 40+ miles of connected trails, 18 parks, Post & Pour and The Retreat clubhouse opening in 2027.`]);
  out.push([`How do I tour ${street()}?`, `Request a private tour on this page. ${T().agent.name} of ${T().name} confirms every showing personally.`]);
  return out.map(x => [x[0], x[1].replace(/\s+/g, ' ').replace(/\.\./g, '.'), null]);
}
const GBP_URL = 'https://maps.google.com/?cid=13168785543785810551';
function jsonLd(page) {
  const t = T(), org = { '@type': 'RealEstateAgent', '@id': 'https://www.ranchpnw.com/#org', name: t.name, url: 'https://www.ranchpnw.com', sameAs: [GBP_URL, 'https://www.realtrends.com/team-profile/ranchrealestategroup-washington-kellerwilliamsrealtypugetsound/'], hasMap: GBP_URL, address: { '@type': 'PostalAddress', addressLocality: 'Federal Way', addressRegion: 'WA', postalCode: '98003', addressCountry: 'US' }, parentOrganization: { '@type': 'Organization', name: t.affiliation }, areaServed: ['Bonney Lake, WA', 'Tehaleh', 'Lake Tapps, WA', 'Gig Harbor, WA', 'Fox Island, WA', 'Tacoma, WA', 'Federal Way, WA'], employee: { '@type': 'Person', '@id': 'https://www.ranchpnw.com/#chris', name: t.agent.name, jobTitle: 'Listing agent' } };
  const faq = items => ({ '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  if (page === 'tehaleh') {
    const p = PLACES.tehaleh, url = SITE ? SITE.guideUrl + '/' : location.href;
    return { '@context': 'https://schema.org', '@graph': [org,
      { '@type': 'Article', '@id': url + '#guide', headline: 'Living in Tehaleh: trails, parks, schools and The Retreat', description: p.lede, url, inLanguage: 'en-US', datePublished: '2026-11-19', dateModified: new Date(placeChecked('tehaleh')).toISOString().slice(0, 10), image: [url + 'photos/og-tehaleh.jpg', url + 'photos/teh-rainier-boulevard.jpg'],
        author: { '@id': 'https://www.ranchpnw.com/#chris', '@type': 'Person', name: t.agent.name, description: 'Former Tehaleh resident and listing agent with ' + t.name }, publisher: { '@id': 'https://www.ranchpnw.com/#org' }, about: { '@id': url + '#place' } },
      { '@type': 'Place', '@id': url + '#place', name: 'Tehaleh', alternateName: 'Cascadia', description: p.faq[0][1], address: { '@type': 'PostalAddress', addressLocality: 'Bonney Lake', addressRegion: 'WA', postalCode: '98391', addressCountry: 'US' }, containedInPlace: { '@type': 'AdministrativeArea', name: 'Pierce County, Washington' },
        containsPlace: [{ '@type': 'CafeOrCoffeeShop', name: 'Post & Pour', address: { '@type': 'PostalAddress', streetAddress: '19001 Cascadia Blvd. E.', addressLocality: 'Bonney Lake', addressRegion: 'WA', postalCode: '98391' }, url: 'https://www.postandpour.com/', description: 'Café, bistro and tap house in Tehaleh with fire-pit patios and a Mount Rainier view.' }, { '@type': 'Restaurant', name: 'The Mantel, Culinary Ascent', address: { '@type': 'PostalAddress', streetAddress: '19001 Trilogy Parkway East', addressLocality: 'Bonney Lake', addressRegion: 'WA', postalCode: '98391' }, url: 'https://www.mytrilogylife.com/tehaleh/dining/', description: 'Private, members-only restaurant in Seven Summits Lodge at Trilogy at Tehaleh.' }].concat(p.chapters.flatMap(c => (c.grid || []).map(g => ({ '@type': 'Park', name: g[0], description: g[2] })).concat((c.items || []).filter(it => /Park|Hollow|Trails|Retreat|Post & Pour|Center/.test(it[0]) && !c.picks).map(it => ({ '@type': /Post & Pour/.test(it[0]) ? 'CafeOrCoffeeShop' : /Retreat|Center/.test(it[0]) ? 'CivicStructure' : 'Park', name: it[0], description: it[1] }))))) },
      faq(p.faq),
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: t.name, item: 'https://www.ranchpnw.com' }, { '@type': 'ListItem', position: 2, name: 'Life in Tehaleh', item: url }] }] };
  }
  const url = SITE ? SITE.homeUrl : location.href, img = (SITE ? SITE.homeUrl.replace(/\/[^/]*$/, '/') : '') + 'photos/';
  const listed = (L().history.filter(h => h.to === 'active')[0] || {}).at;
  return { '@context': 'https://schema.org', '@graph': [org,
    { '@type': 'RealEstateListing', '@id': url + '#listing', name: V('address') + ' 98391', url, description: E.assets(LID).remarks, datePosted: listed ? new Date(listed).toISOString().slice(0, 10) : undefined, image: [img + 'og-19917.jpg', img + 'great-room.jpg', img + 'kitchen-island.jpg', img + 'rainier-view2.jpg', img + 'deck-fire.jpg', img + 'front-dusk.jpg'],
      offers: { '@type': 'Offer', price: V('price'), priceCurrency: 'USD', availability: 'https://schema.org/InStock', seller: { '@id': 'https://www.ranchpnw.com/#org' } }, about: { '@id': url + '#home' }, provider: { '@id': 'https://www.ranchpnw.com/#org' } },
    { '@type': 'SingleFamilyResidence', '@id': url + '#home', name: street(), address: { '@type': 'PostalAddress', streetAddress: street(), addressLocality: 'Bonney Lake', addressRegion: 'WA', postalCode: '98391', addressCountry: 'US' }, numberOfBedrooms: V('beds'), numberOfRooms: V('beds'),
      additionalProperty: [{ '@type': 'PropertyValue', name: 'Bathrooms', value: String(V('baths')) }, { '@type': 'PropertyValue', name: 'School district', value: V('school_district') }],
      amenityFeature: ['Central air conditioning', 'EV charger', 'Cat-6 wiring', 'New 24×22 covered deck with plumbed fire pit', 'Backs to recorded open-space greenbelt', 'Mount Rainier views from the primary suite', 'Walk-in pantry'].map(n => ({ '@type': 'LocationFeatureSpecification', name: n, value: true })),
      containedInPlace: { '@type': 'Place', name: 'Tehaleh', url: SITE ? SITE.guideUrl + '/' : undefined } },
    faq(homeFaq()),
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: t.name, item: 'https://www.ranchpnw.com' }, { '@type': 'ListItem', position: 2, name: 'Tehaleh', item: SITE ? SITE.guideUrl + '/' : url }, { '@type': 'ListItem', position: 3, name: street(), item: url }] }] };
}
window.__jsonLd = jsonLd;
function srcLink(k) { const s = SRC[k]; return s ? `<a class="src-link" href="${s[1]}" target="_blank" rel="noopener" data-out="${k}">${esc(s[0])} ↗</a>` : ''; }
function dayChap(c, i) {
  const first = T().agent.name.split(' ')[0];
  return `<section class="dayl"><div class="chapter wrap"><div class="head"><span class="n">${String(i + 1).padStart(2, '0')}</span><h2>${esc(c.t)}</h2></div>
    <div class="eyebrow" style="margin:-12px 0 22px">${esc(c.kicker)}</div>
    <div class="gintro"><p class="serif">“${esc(c.intro)}”</p></div>
    <ol class="dayline">${c.moments.map(([when, title, text, ph, s]) => `<li>${ph ? pimg(ph, 'ph s') : ''}<div><div class="when">${esc(when)}</div><h3 class="serif">${esc(title)}</h3><p>${esc(text)}</p>${s ? srcLink(s) : ''}</div></li>`).join('')}</ol>
    <div class="honest">${c.honest.map(([h, t]) => `<div><h3 class="serif">${esc(h)}</h3><p>${esc(t)}</p></div>`).join('')}</div>
    <p class="sig">— ${esc(T().agent.name)}, who lived in Tehaleh with his family</p></div></section>`;
}
function picksChap(c, i) {
  const first = T().agent.name.split(' ')[0];
  return `<section class="picks"><div class="chapter wrap"><div class="head"><span class="n">${String(i + 1).padStart(2, '0')}</span><h2>${esc(first)}’s picks</h2></div>
    <div class="gintro"><div class="eyebrow" style="margin-bottom:12px">${esc(c.t)}</div><p class="serif">“${esc(c.intro)}”</p></div>
    <div class="pickgrid">${c.items.map(([n, d, ph]) => `<article class="${ph ? '' : 'nophoto'}">${ph ? pimg(ph, 'ph s') : ''}<h3 class="serif">${esc(n)}</h3><p>${esc(d)}</p></article>`).join('')}</div>
    <p class="sig">— ${esc(T().agent.name)} · ${esc(T().name)}</p></div></section>`;
}
function guide() {
  const p = PLACES.tehaleh, parent = PLACES[p.parent];
  const chap = (c, i) => c.picks ? picksChap(c, i) : c.day ? dayChap(c, i) : `<section class="${c.dark ? 'dark' : ''}"><div class="chapter wrap"><div class="head"><span class="n">${String(i + 1).padStart(2, '0')}</span><h2>${esc(c.t)}</h2></div>
    ${c.kicker ? `<div class="eyebrow" style="margin:-12px 0 22px">${esc(c.kicker)}</div>` : ''}
    <div class="gintro"><p class="serif">${esc(c.intro)}</p></div>
    ${c.feature ? `<div class="gfeature">${pimg(c.photo, 'ph t')}<div class="gfacts">${c.feature.map(([v, k]) => `<div><div class="v">${esc(v)}</div><div class="k">${esc(k)}</div></div>`).join('')}</div></div>` : ''}
    ${c.grid ? `<div class="duo" style="align-items:start">${pimg(c.photo, 'ph m')}<div class="ggrid">${c.grid.map(([n, age, d]) => `<div><div class="age">${/^\d/.test(age) ? 'Ages ' + esc(age) : esc(age)}</div><h3 class="serif">${esc(n)}</h3><p>${esc(d)}</p></div>`).join('')}<div style="grid-column:1/-1">${srcLink(c.src)}</div></div></div>`
      : `<div class="duo" style="align-items:start">${c.feature ? (c.photo2 ? pimg(c.photo2, 'ph m') : '<div></div>') : pimg(c.photo, 'ph m')}<div class="placelist">${c.items.map(([n, d, s, how]) => `<div><h3 class="serif">${esc(n)}</h3><p>${esc(d)}</p>${how ? `<div class="small muted" style="margin:-6px 0 8px">${esc(how)}</div>` : ''}${srcLink(s)}</div>`).join('')}</div></div>`}
    ${c.note ? `<p class="small ${c.dark ? '' : 'muted'}" style="margin-top:22px;max-width:70ch">${esc(c.note)}</p>` : ''}</div></section>`;
  return `<div class="story m-${L().mode || 'editorial'}">
  <header class="hero">
    <div class="topnav"><div class="mark"><span class="st">Life in ${esc(p.name)}</span><span class="ct">${esc(parent.name)}, Washington</span></div><div class="tn"><button class="menu" data-act="share-guide">Share</button><a class="cta" href="${SITE ? SITE.homeUrl : '#story'}">The home</a></div></div>
    <div class="photo"><img${webp(PLACE_MEDIA[p.hero][0])} alt="${esc(PLACE_MEDIA[p.hero][1])}" loading="eager" fetchpriority="high"></div><div class="scrim"></div>
    <div class="copy"><h1 style="max-width:13ch"><span class="h1k">Living in Tehaleh · Bonney Lake, Washington</span>${esc(p.headline)}</h1><div class="eyebrow" style="margin-top:14px">A guide from ${esc(T().name)}</div></div><div class="credit">Photo courtesy of Tehaleh</div></header>
  <section class="lede narrow"><p class="big">${esc(p.lede)}</p>
    <div class="glance" aria-label="Tehaleh at a glance"><div class="eyebrow">Tehaleh at a glance</div><dl>${p.glance.map(([k, v, s]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)} ${srcLink(s)}</dd></div>`).join('')}</dl><p class="small muted" style="margin:14px 0 0">Updated ${fmtDay(placeChecked('tehaleh'))} by ${esc(T().agent.name)}, ${esc(T().name)}.</p></div>
    <nav class="gtoc" aria-label="In this guide">${p.chapters.map((c, i) => `<a href="#tehaleh" data-scroll="g-${i}">${esc(c.t)}</a>`).join('')}</nav></section>
  <section class="wrap" style="padding-bottom:clamp(40px,6vw,72px)"><div class="stats" style="margin-top:0">${p.stats.map(([v, k, s]) => `<div><div class="v">${v}</div><div class="k">${esc(k)}</div><div style="margin-top:8px">${srcLink(s)}</div></div>`).join('')}</div>
    <p class="small muted" style="margin-top:24px;max-width:70ch">${esc(p.notes[0])}</p></section>
  ${p.chapters.map((c, i) => `<div id="g-${i}">${chap(c, i)}</div>`).join('')}
  ${faqBlock('Tehaleh questions, answered', p.faq)}
  <section class="wrap" style="padding-top:clamp(72px,9vw,120px);padding-bottom:clamp(72px,9vw,120px)">
    <h2 class="serif" style="font-size:clamp(30px,3.6vw,46px);margin:0 0 10px">Living here, made easier.</h2>
    <p class="muted" style="margin:0 0 32px;max-width:60ch">${esc(T().agent.name)} sells in Tehaleh often. Choose what’s useful — we only ask for details to send what you ask for.</p>
    <div class="next">
      <div class="card"><span class="eyebrow">First notice</span><span class="t">Homes like this in Tehaleh</span><span class="muted">Hear about new listings here before the weekend rush.</span><button class="btn" data-act="place-lead" data-k="alerts">Get first notice</button></div>
      <div class="card"><span class="eyebrow">The Retreat</span><span class="t">Clubhouse updates</span><span class="muted">A note when there’s real news on the 2027 opening.</span><button class="btn ghost" data-act="place-lead" data-k="updates">Keep me posted</button></div>
      <div class="card"><span class="eyebrow">In person</span><span class="t">A guided Tehaleh tour</span><span class="muted">Trails, parks and neighborhoods with someone who knows them.</span><button class="btn ghost" data-act="place-lead" data-k="community-tour">Plan a tour</button></div>
      <div class="card"><span class="eyebrow">Ask</span><span class="t">A local question</span><span class="muted">About the home, the trails or the area.</span><button class="btn ghost" data-act="ask" data-from="buyer">Ask</button></div>
    </div>
    <p class="small muted" style="margin-top:28px;max-width:70ch">${esc(p.fine)} Sources were checked on ${fmtDay(placeChecked('tehaleh'))} and are re-checked monthly. Community photography courtesy of Tehaleh.</p>
  </section>
  ${footer()}</div>`;
}

/* ---------- small public pages ---------- */
function valuation() {
  return `<div class="private"><div class="phone"><div class="pbar"><span class="mark">${esc(T().name.toUpperCase())}</span><a href="#story" class="small">Back to the home</a></div>
  ${img('front-dusk', '', 'style="width:100%;height:260px;object-fit:cover"')}
  <div class="pad" style="padding-top:32px;padding-bottom:48px"><div class="eyebrow">Private valuation</div><h1 class="serif" style="font-size:36px;line-height:1.1;margin:10px 0 12px">Curious what your home is worth?</h1>
  <p class="muted">Chris prepares each valuation personally — real sales, your home’s upgrades, today’s buyers. No automated estimate.</p>
  <form data-form="valuation"><div class="field"><label for="va">Your home’s address</label><input id="va" name="address" required autocomplete="street-address"></div>
  ${contactFields('v')}${honeypot()}
  <button class="btn wide">Request my valuation</button><p class="consent-note">By requesting, you’re asking ${esc(T().agent.name)} to contact you about your home’s value.</p></form></div></div></div>`;
}
function homeEdit() {
  const cats = ['Interior design', 'Staging', 'Painting', 'Landscaping', 'Organization', 'Remodeling'];
  return `<div class="private"><div class="phone"><div class="pbar"><span class="mark">THE HOME EDIT</span><a href="#story" class="small">Back to the home</a></div>
  ${img('dining', '', 'style="width:100%;height:260px;object-fit:cover"')}
  <div class="pad" style="padding-top:32px;padding-bottom:48px"><h1 class="serif" style="font-size:34px;line-height:1.12;margin:0 0 12px">Love the look? Meet the people who can bring it home.</h1>
  <p class="muted">Introductions to professionals ${esc(T().name)} trusts. We only share your details with the partner you choose, and only with your permission.</p>
  <form data-form="vendor"><div class="field"><label>What would you like help with?</label></div><div class="chips">${cats.map(c => `<button type="button" class="chip" data-act="pick-cat" data-v="${c}" aria-pressed="${ui.cat === c}">${c}</button>`).join('')}</div>
  ${contactFields('h')}${honeypot()}
  <button class="btn wide">Request an introduction</button><p class="consent-note">We’ll share your details only with the one partner you choose.</p></form>
  <p class="small muted" style="margin-top:16px">Referral relationships and any fees are disclosed before you engage a partner.</p></div></div></div>`;
}
function between() {
  return `<div class="private"><div class="phone" style="text-align:center"><div class="pbar"><span class="mark">${esc(T().name.toUpperCase())}</span><span></span></div>
  <div class="pad" style="padding-top:72px;padding-bottom:72px"><div class="eyebrow">This sign is between homes</div><h1 class="serif" style="font-size:38px;line-height:1.1;margin:14px 0">Thank you for scanning.</h1>
  <p class="muted">The home this sign last introduced has moved on. We’d still love to help.</p>
  <div style="display:flex;flex-direction:column;gap:10px;margin-top:28px"><a class="btn" href="#valuation">What’s my home worth?</a><a class="btn ghost" href="#story">See our featured home</a></div></div></div></div>`;
}

/* ============================================================
   SELLER (private)
   ============================================================ */
function sellerGate(next) {
  return `<div class="private"><div class="phone"><div class="pbar"><span class="mark">YOUR CONCIERGE</span><a href="#story" class="small">Public story</a></div>
  ${img('front-dusk', '', 'style="width:100%;height:300px;object-fit:cover"')}
  <div class="pad" style="padding-top:36px;padding-bottom:48px"><h1 class="serif" style="font-size:34px;margin:0 0 10px">Welcome home.</h1>
  <p class="muted">This space is private to the owners of ${esc(street())}. Enter the access code from your agent.</p>
  <form data-form="seller-login" data-next="${next}"><div class="field"><label for="sc">Access code</label><input id="sc" name="code" autocomplete="one-time-code" autocapitalize="characters" required></div>
  <button class="btn wide">Enter</button></form>${ui.loginError ? '<p class="small" style="color:var(--warn)">That code didn’t match. Check the message from your agent.</p>' : ''}
  <p class="small muted" style="margin-top:22px">The public story link never opens this page.</p></div></div></div>`;
}
function sellerData() { try { return E.sellerView(LID, session.seller); } catch (e) { return null; } }

function reveal() {
  const s = sellerData(); if (!s) return sellerGate('reveal');
  const l = L(); const isLive = PUBLIC.indexOf(l.state) >= 0 && l.updates.some(u => u.reveal);
  const quiet = s.seller.tone === 'quiet';
  if (!isLive) return `<div class="reveal">${img('front-dusk', 'bg')}<div class="scrim"></div><div class="inner"><div class="eyebrow" style="color:#D9C2A0">Getting ready</div>
    <h1>Your home’s story is nearly ready.</h1><p style="color:#D8D2C7;margin-top:18px">It goes live the moment NWMLS confirms your listing is active. You’ll hear from us right then.</p>
    <div class="acts"><a class="btn light" href="#seller">Back to your journey</a></div></div></div>`;
  const when = l.history.filter(h => h.to === 'active').slice(-1)[0];
  return `<div class="reveal">${img('front-dusk', 'bg')}<div class="scrim"></div><div class="inner">
    <div class="eyebrow" style="color:#D9C2A0;display:flex;gap:8px;align-items:center"><span class="dot"></span>Live on NWMLS · verified ${when ? esc(new Date(when.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })) : ''}</div>
    <h1>${quiet ? 'Your home is now live.' : 'Your home is officially live.'}</h1>
    <p style="color:#D8D2C7;margin-top:18px;line-height:1.6">${quiet ? 'Its story is ready whenever you’d like to share it — or not at all.' : 'Its story is ready to share. Here is how it is being introduced to buyers, and an easy way to send it to the people who matter to you.'}</p>
    <div class="acts"><a class="btn light wide" href="#story" style="justify-content:space-between">Experience your home’s story <span aria-hidden="true">→</span></a>
      <button class="btn line wide" data-act="share-note" style="justify-content:space-between">Share with a personal note <span aria-hidden="true">→</span></button>
      <div class="row"><button class="btn line" data-act="copy-share">Copy your link</button><button class="btn line" data-act="story-card">Share graphics</button></div>
      <p class="small" style="color:#9C968B;text-align:center;margin:6px 0 0">Your link is tracked to you so we can show how many people it reached — never who they are.</p>
      <a href="#seller" class="btn line wide" style="margin-top:6px;justify-content:space-between">Your home’s journey <span aria-hidden="true">→</span></a></div></div></div>`;
}

function portal() {
  const s = sellerData(); if (!s) return sellerGate('seller');
  const l = L(); const idx = LC.SPINE.indexOf(l.state === 'market_engagement' ? 'market_engagement' : l.state);
  const ci = idx < 0 ? 3 : idx;
  const days = l.history.filter(h => h.to === 'active')[0];
  const dom = days ? Math.max(1, Math.ceil((E.now() - days.at) / 864e5)) : null;
  const latest = s.updates[0];
  const tone = s.seller.tone;
  const labels = ['Signed', 'Preparing', 'Ready', 'Active', 'Engaged', 'Contract', 'Closed'];
  return `<div class="private"><div class="phone">
  <div class="pbar"><span class="mark">YOUR CONCIERGE</span><button class="btn text small" data-act="seller-out">Sign out</button></div>
  <div class="pad" style="padding-top:30px"><p class="small muted" style="margin:0">${greeting()}</p>
    <h1 class="serif" style="font-size:34px;line-height:1.12;margin:6px 0 4px">Your home’s journey</h1>
    <p class="small" style="margin:0">${esc(street())} · ${LC.STATES[l.state]}${dom ? ' · day ' + dom + ' on market' : ''}</p>
    <div class="journey">${LC.SPINE.map((st, i) => `<span class="${i < ci ? 'd' : i === ci ? 'c' : ''}"></span>`).join('')}</div>
    <div class="jl">${labels.map((x, i) => i === ci ? `<b>${x}</b>` : `<span>${x}</span>`).join('')}</div></div>
  <div class="pad">${latest ? `<div class="letter"><div class="eyebrow" style="margin-bottom:12px">Your latest update</div><p class="serif" style="margin:0">${esc(latest.text)}</p><p class="small muted" style="margin:14px 0 0">— ${esc(T().agent.name.split(' ')[0])} and your Concierge · ${ago(latest.at)}</p>${latest.reveal ? '<a class="btn wide" href="#reveal" style="margin-top:18px">Open your launch</a>' : ''}</div>`
    : `<div class="letter"><div class="eyebrow" style="margin-bottom:12px">Getting ready</div><p class="serif" style="margin:0">Photography, facts and your home’s story are approved. We launch the moment NWMLS confirms you’re live.</p></div>`}
  ${s.approvals.map(a => `<div class="ok-card"><div class="eyebrow">Needs your OK</div><p style="margin:6px 0 0;font-size:16px;line-height:1.5">${esc(a.label)}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px"><button class="btn light" data-act="seller-approve" data-id="${a.id}">Approve</button><button class="btn line" data-act="seller-decline" data-id="${a.id}">Suggest another time</button></div></div>`).join('')}
  </div>
  <div class="pad" style="padding-top:34px"><div class="eyebrow" style="color:var(--muted);margin-bottom:14px">Done for you</div>
    <div class="list">${s.done.length ? s.done.slice(0, 6).map(d => `<div><span style="color:var(--ok)" aria-hidden="true">✓</span><span>${esc(d.text)}</span><span class="when">${ago(d.at)}</span></div>`).join('') : '<div class="muted">Your Concierge will list everything it does for you here.</div>'}</div></div>
  ${l.state === 'under_contract' ? `<div class="pad" style="padding-top:34px"><div class="eyebrow" style="color:var(--muted);margin-bottom:14px">Your path to closing</div>
    ${l.contract && l.contract.milestones.length ? `<div class="list">${l.contract.milestones.map(m => `<div><span style="color:${m.at < E.now() ? 'var(--ok)' : 'var(--accent)'}" aria-hidden="true">${m.at < E.now() ? '✓' : '○'}</span><span>${esc(m.label)}</span><span class="when">${new Date(m.at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>`).join('')}</div><p class="small muted">You’ll get a reminder two days before each.</p>` : `<p class="muted">${esc(T().agent.name.split(' ')[0])} is confirming your timeline — inspection, appraisal, financing and closing. It appears here the moment it’s set.</p>`}</div>` : ''}
  <div class="pad tiles" style="padding-top:28px"><a href="#report"><span class="t">Performance</span><span class="small muted">Weekly report</span></a><a href="#story"><span class="t">Your story</span><span class="small muted">As buyers see it</span></a>
    <a href="#reveal"><span class="t">Share</span><span class="small muted">Your tracked link</span></a>${['under_contract', 'closed'].indexOf(l.state) >= 0 ? '<a href="#closing-book"><span class="t">Closing book</span><span class="small muted">The story of your sale</span></a>' : ''}<a href="#seller" data-act="ask" data-from="seller"><span class="t">Ask</span><span class="small muted">Your Concierge</span></a></div>
  <div class="pad" style="padding-top:28px"><form data-form="ask" data-from="seller"><div class="field"><label for="aq">Ask your Concierge</label><div style="display:flex"><input id="aq" name="q" placeholder="What did buyers say about the yard?" style="flex:1"><button class="btn" aria-label="Send question" style="padding:0 18px">→</button></div></div></form>
    <p class="small muted" style="margin:-4px 0 0">Answers come from your listing’s verified records. Anything needing judgment goes to ${esc(T().agent.name.split(' ')[0])}.</p>
    ${s.questions.slice(0, 3).map(q => `<div class="notice" style="margin-top:12px"><b>${esc(q.text)}</b><br>${q.answer ? esc(q.answer) + `<div class="small muted" style="margin-top:6px">${q.by === 'concierge' ? 'Answered from verified facts' : 'From ' + esc(q.by)}</div>` : `<span class="muted">${esc(T().agent.name.split(' ')[0])} will answer personally.</span>`}</div>`).join('')}</div>
  <div class="pad" style="padding:30px 24px 60px"><div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line);padding-top:18px;font-size:14px;gap:12px"><span>How we write to you</span>
    <span class="seg" role="group" aria-label="Communication tone"><button data-act="tone" data-v="celebratory" aria-pressed="${tone === 'celebratory'}">Celebratory</button><button data-act="tone" data-v="quiet" aria-pressed="${tone === 'quiet'}">Quiet</button></span></div></div>
  </div></div>`;
}

function reportView() {
  const s = sellerData(); if (!s && !(caps.user && caps.user.canEdit())) return sellerGate('report');
  const r = E.report(LID);
  const m = k => r.metrics.find(x => x.key === k);
  const cell = x => `<div><div class="v">${x.value == null ? '—' : x.value}</div><div class="small">${esc(x.label)}</div><div class="s">${esc(x.source)} · ${esc(x.window)} · ${x.status === 'no-data' ? 'no data yet' : x.status === 'stale' ? '<b style="color:var(--warn)">stale</b> ' + ago(x.updated) : ago(x.updated)}</div></div>`;
  const max = Math.max(1, ...r.days);
  const pk = r.days.indexOf(Math.max(...r.days));
  const total = Object.values(r.bySource).reduce((a, b) => a + b, 0) || 1;
  const names = { 'seller-share': 'Your shared link', qr: 'QR signs', social: 'Social', email: 'Email', direct: 'Direct & search', agents: 'Agent network' };
  const dlabels = []; for (let d = 6; d >= 0; d--) dlabels.push(day(Date.now() - d * 864e5).slice(0, 1));
  return `<div class="private"><div class="phone">
  <div style="position:relative;height:300px;background:var(--night)">${img('greenbelt-yard', '', 'style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.85"')}<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(22,25,27,.1),rgba(22,25,27,.88))"></div>
    <div style="position:absolute;left:24px;right:24px;bottom:26px;color:#F7F5F1"><div class="eyebrow" style="color:#E7D7BF">This week · ${new Date(Date.now() - 6 * 864e5).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
    <h1 class="serif" style="font-size:32px;line-height:1.12;margin:10px 0 0">What happened, what we learned, what comes next.</h1></div></div>
  ${r.demo ? '<div class="banner pad">Includes sample data loaded for the demonstration — clearly not real buyer activity.</div>' : ''}
  <div class="pad" style="padding-top:26px"><p class="serif" style="font-size:19px;line-height:1.5;margin:0">${esc(r.insight)}</p></div>
  <div class="pad" style="padding-top:24px"><div class="metrics">${cell(m('visits'))}${cell(m('showings'))}${cell(m('scans'))}${cell(m('guests'))}</div></div>
  <div class="pad" style="padding-top:30px"><div class="eyebrow" style="color:var(--muted);margin-bottom:14px">Site visits by day</div>
    <div class="bars" role="img" aria-label="Site visits per day for the last 7 days: ${r.days.join(', ')}">${r.days.map((d, i) => `<div class="${i === pk && d ? 'pk' : ''}" style="height:${Math.round(d / max * 100)}%"></div>`).join('')}</div>
    <div style="display:flex;gap:8px;margin-top:8px;font-size:11px;color:var(--muted)">${dlabels.map(x => `<span style="flex:1;text-align:center">${x}</span>`).join('')}</div></div>
  <div class="pad" style="padding-top:30px"><div class="eyebrow" style="color:var(--muted);margin-bottom:14px">Where visitors came from</div>
    ${Object.keys(r.bySource).length ? Object.entries(r.bySource).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<div class="src"><span class="lab">${esc(names[k] || k)}</span><span class="tr"><i style="width:${Math.round(n / total * 100)}%"></i></span><span class="n">${n}</span></div>`).join('') : '<p class="small muted">No visits recorded yet.</p>'}
    ${m('shared').value ? `<p class="small muted">${m('shared').value} visits came from the link you shared.</p>` : ''}</div>
  <div class="pad" style="padding-top:22px"><div class="notice"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><b>Zillow &amp; Redfin views</b><span class="tag acc">Unavailable</span></div>
    <p style="margin:8px 0 0">These portals don’t share reliable data with us. We won’t estimate them. Everything above is measured directly.</p></div></div>
  <div class="pad" style="padding:22px 24px 60px"><div class="ok-card" style="margin:0"><div class="eyebrow">Next week</div><p style="margin:8px 0 0;line-height:1.6">Keep the story in front of buyers, follow up on every request within the hour, and refresh the lead photo if visits don’t turn into showings.</p></div>
    <div style="display:flex;gap:10px;margin-top:14px"><button class="btn ghost" style="flex:1" data-act="copy-report">Copy report</button><a class="btn ghost" style="flex:1" href="${s ? '#seller' : '#desk'}">Done</a></div></div>
  </div></div>`;
}

/* ============================================================
   OPEN HOUSE HOST + SIGN (staff, field)
   ============================================================ */
function host() {
  const l = L(), a = E.assets(LID);
  const oh = l.openHouses.find(o => o.status === 'scheduled') || l.openHouses.find(o => o.status === 'completed');
  if (!oh) return `<div class="private" style="background:var(--night);color:#F7F5F1"><div class="phone pad" style="padding-top:80px;padding-bottom:80px"><div class="eyebrow" style="color:#D9C2A0">Open house host</div>
    <h1 class="serif" style="font-size:34px">No open house is scheduled.</h1><p style="color:#B9B2A6">Schedule one from The Desk. The seller approves it in their portal, and the Concierge prepares everything.</p><a class="btn light" href="#desk-run">Go to The Desk</a></div></div>`;
  const done = oh.status === 'completed';
  return `<div class="private" style="background:#1E2327;color:#F7F5F1"><div class="phone">
  <div style="position:relative;height:210px">${img('front-dusk', '', 'style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55"')}<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(30,35,39,.3),#1E2327)"></div>
    <div style="position:absolute;left:24px;right:24px;bottom:18px"><div class="small" style="letter-spacing:.14em;text-transform:uppercase;color:${done ? '#B9B2A6' : '#B8D4B2'};display:flex;gap:8px;align-items:center"><span class="dot"></span>${done ? 'Completed' : 'Live'} · ${esc(oh.label || '')}</div>
    <div class="serif" style="font-size:28px;margin-top:6px">${esc(street())}</div><div class="small" style="color:#B9B2A6">Hosted by ${esc(oh.host)}</div></div></div>
  <div class="pad" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding-top:18px">
    <div style="background:#2A3035;padding:18px"><div class="small" style="color:#B9B2A6">Walk-in groups</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px"><span class="serif" style="font-size:40px">${oh.guests}</span>${done ? '' : '<button class="btn light" style="width:48px;padding:0;font-size:22px" data-act="oh-walkin" aria-label="Add a walk-in group">+</button>'}</div></div>
    <div style="background:#2A3035;padding:18px"><div class="small" style="color:#B9B2A6">Signed in by QR</div><div class="serif" style="font-size:40px;margin-top:6px">${oh.qr}</div></div></div>
  <p class="small pad" style="color:#9C968B;margin:10px 0 0">Attendance is tracked separately from leads. A guest becomes a lead only by asking us for something.</p>
  <div class="pad" style="padding-top:26px"><div class="eyebrow" style="color:#D9C2A0;margin-bottom:12px">Talking points · verified</div>
    ${a.talkingPoints.map(t => `<div style="background:#2A3035;padding:14px 16px;margin-bottom:8px;font-size:14px;line-height:1.5">${esc(t)}</div>`).join('')}</div>
  ${done ? `<div class="pad" style="padding:26px 24px 60px"><p>Event closed. Follow-ups went only to guests who agreed, and the seller’s recap is in their portal.</p><a class="btn light" href="#desk">Back to The Desk</a></div>` : `
  <div class="pad" style="padding-top:26px"><div class="eyebrow" style="color:#D9C2A0;margin-bottom:12px">Quick capture</div>
    <form data-form="oh-guest" style="--card:#2A3035;--line:#3A4248;--muted:#B9B2A6"><div class="field"><label for="gn">Guest name (optional)</label><input id="gn" name="name"></div>
    <div class="field"><label for="gt">Note</label><input id="gt" name="note" placeholder="Loved the kitchen, asked about HOA"></div>
    <div class="chips">${['Neighbor', 'Has agent', 'Wants showing', 'Valuation'].map(c => `<button type="button" class="chip" style="border-color:#3A4248" data-act="tag" data-v="${c}" aria-pressed="${ui.tags.indexOf(c) >= 0}">${c}</button>`).join('')}</div>
    <label class="check"><input type="checkbox" name="consent"> Guest agreed to a follow-up</label><button class="btn light wide">Save guest</button></form>
    ${oh.notes.length ? `<p class="small" style="color:#B9B2A6">${oh.notes.length} guest note${oh.notes.length > 1 ? 's' : ''} saved.</p>` : ''}</div>
  <div class="pad" style="padding:28px 24px 64px"><button class="btn light wide" data-act="oh-end" style="font-weight:600">End event &amp; hand off</button>
    <p class="small" style="color:#B9B2A6;text-align:center;margin-top:12px;line-height:1.5">The Concierge sends every consented follow-up, updates the record and writes the seller’s recap.</p></div>`}
  </div></div>`;
}
function signView() {
  const qr = (id) => {
    const url = shareUrl('qr-' + id.toLowerCase());
    if (typeof qrcode !== 'function') return `<div class="small" style="padding:12px;word-break:break-all">${esc(url)}</div>`;
    const q = qrcode(0, 'M'); q.addData(url); q.make();
    return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  };
  const sA = DB.signs['R-014-A'];
  return `<div class="signwrap"><div style="display:flex;flex-direction:column;gap:18px;align-items:center;width:100%">
  <div class="sign"><div class="head"><div class="serif" style="font-size:clamp(12px,2.6vw,18px);letter-spacing:.4em;color:var(--accent)">OPEN HOUSE</div><div class="w">Welcome.</div><div style="width:64px;height:1px;background:var(--accent);margin:clamp(16px,4%,34px) auto 0"></div></div>
    <div class="qrs"><div class="qr"><div class="code">${qr('R-014-A')}</div><div class="t">Explore This Home</div><div class="small muted">The full story and a private tour</div></div>
      <div class="qr"><div class="code">${qr('R-014-B')}</div><div class="t">What’s Yours Worth?</div><div class="small muted">A private valuation</div></div></div>
    <div class="base"><div><div class="serif" style="font-size:clamp(11px,2.2vw,17px);letter-spacing:.24em">${esc(T().name.toUpperCase())}</div><div style="font-size:clamp(11px,2.2vw,17px);margin-top:6px">${esc(T().affiliation)}</div></div><div class="small" style="color:#B9B2A6;text-align:right">Sign R-014<br>Permanent ID</div></div></div>
  <div class="notice" style="background:var(--ground);max-width:720px;width:100%">These are real, scannable codes. Each sign keeps one permanent ID; the Concierge points it at whichever home it stands in front of. R-014 is ${sA.listing ? 'assigned to ' + esc(street()) : '<b>unassigned</b> — scans land on the between-homes page'}.
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:12px"><button class="btn ghost" data-act="sign-toggle">${sA.listing ? 'Unassign R-014' : 'Assign R-014 to this home'}</button><a class="btn ghost" href="#desk">The Desk</a></div></div></div></div>`;
}

/* ============================================================
   THE DESK (staff)
   ============================================================ */
function deskShell(tab, body) {
  const l = L();
  const dom = l.history.filter(h => h.to === 'active')[0];
  const tabs = [['desk', 'Overview'], ['desk-runs', 'How it runs'], ['desk-facts', 'Facts'], ['desk-activity', 'Everything handled'], ['desk-run', 'Run the scenario'], ['desk-kit', 'Print & present'], ['setup', 'Setup'], ['system', 'System & tests']];
  return `<div class="private desk">${DB.clockOffset ? `<div class="banner" style="text-align:center">Simulated time: <b>${when(E.now())}</b> · <button class="btn text small" data-act="clock-reset">Back to now</button></div>` : ''}<div class="wrap"><div class="top"><span class="mark">THE DESK</span><span class="small">${greeting()}, ${esc(T().agent.name.split(' ')[0])}</span></div>
  <div class="dhero">${img('front-dusk', '')}<div class="scrim"></div><div class="c"><div><div class="eyebrow">${dom ? 'Day ' + Math.max(1, Math.ceil((E.now() - dom.at) / 864e5)) + ' on market' : LC.STATES[l.state]}</div><h1>${esc(street())}</h1></div>
    <div class="small" style="display:flex;gap:8px;align-items:center"><span class="dot" style="color:#B8D4B2"></span>Concierge is running · ${esc(LC.STATES[l.state])}</div></div></div>
  <nav class="tabs" aria-label="Desk">${tabs.map(([h, n]) => `<a href="#${h}" ${tab === h ? 'aria-current="page"' : ''}>${n}</a>`).join('')}</nav>
  ${body}</div></div>`;
}
function decisions() {
  const l = L(); const out = [];
  l.exceptions.filter(x => x.open).forEach(x => {
    if (x.type === 'judgment' && l.approvals.some(a => a.status === 'open' && a.kind === 'reply.seller_judgment' && x.data && a.key === 'reply:' + x.data.q)) return;
    out.push({ kind: 'ex', x });
  });
  l.approvals.filter(a => a.status === 'open' && a.who === 'staff').forEach(a => out.push({ kind: 'ap', a }));
  const rank = d => d.kind === 'ex' ? ({ authorization: 0, contract: 0.2, offer: 0.3, research: 0.8, fact: 1, judgment: 3, integration: 4, recheck: 6 }[d.x.type] ?? 5) : ({ 'reply.seller_judgment': 2, 'price.change': 1.5, 'send.seller_live': 0.5 }[d.a.kind] ?? 3);
  return out.sort((p, q) => rank(p) - rank(q));
}
function decisionCard(d) {
  if (d.kind === 'ex') {
    const x = d.x;
    if (x.type === 'fact') {
      const open = ui.editing === 'sqft';
      return `<div class="decision"><div class="eyebrow">A fact to confirm</div><div class="t">The county and the builder list different square footage.</div><div class="d">It stays off every page until you choose. Enter the figure from the source you trust.</div>
      ${open ? `<form data-form="sqft"><div class="chips">${['County record', 'Builder plan', 'New measurement'].map(s => `<button type="button" class="chip" data-act="sqft-src" data-v="${s}" aria-pressed="${ui.sqftSource === s}">${s}</button>`).join('')}</div>
        <div class="field"><label for="sq">Square feet (${esc(ui.sqftSource)})</label><input id="sq" name="sqft" inputmode="numeric" pattern="[0-9]{3,5}" required></div><div class="acts"><button class="btn">Confirm everywhere</button><button type="button" class="btn text" data-act="edit" data-v="">Cancel</button></div></form>`
        : `<div class="acts"><button class="btn" data-act="edit" data-v="sqft">Compare &amp; choose</button><button class="btn text" data-act="resolve" data-id="${x.id}">Keep it hidden</button></div>`}</div>`;
    }
    if (x.type === 'authorization') return `<div class="decision"><div class="eyebrow">Ready to go live</div><div class="t">NWMLS shows the listing Active. Confirm the seller signed off on going live.</div><div class="d">Nothing launches until you do. Then the story publishes, the seller is told, and marketing begins.</div>
      <div class="acts"><button class="btn" data-act="authorize-live">Authorize &amp; launch</button><button class="btn text" data-act="resolve" data-id="${x.id}">Not yet</button></div></div>`;
    if (x.type === 'contract') return `<div class="decision"><div class="eyebrow">Under contract</div><div class="t">Enter the contract dates.</div><div class="d">${esc(x.detail)}</div>
      <form data-form="contract" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">${[['inspection', 'Inspection', 7], ['appraisal', 'Appraisal', 14], ['financing', 'Financing', 21], ['closing', 'Closing', 30]].map(([k, n, d]) => `<div class="field" style="margin:0"><label for="c-${k}">${n}</label><input id="c-${k}" type="date" name="${k}" value="${new Date(E.now() + d * 864e5).toISOString().slice(0, 10)}" required></div>`).join('')}
      <button class="btn" style="grid-column:1/-1">Confirm timeline</button></form></div>`;
    if (x.type === 'research') return `<div class="decision"><div class="eyebrow">Research found a change</div><div class="t">${esc(x.title)}</div><div class="d">${esc(x.detail)}</div><div class="acts"><button class="btn" data-act="research-apply" data-id="${x.id}">Update everywhere</button><button class="btn text" data-act="resolve" data-id="${x.id}">Keep as is</button></div></div>`;
    if (x.type === 'offer') return `<div class="decision"><div class="eyebrow">An offer arrived</div><div class="t">Review it in your transaction system, then call your seller.</div><div class="d">${esc(x.detail)}</div><div class="acts"><button class="btn" data-act="resolve" data-id="${x.id}">I’ve reviewed it</button></div></div>`;
    if (x.type === 'recheck') return `<div class="decision"><div class="eyebrow">Monthly check</div><div class="t">Are the Tehaleh facts still right?</div><div class="d">40+ miles of trails, 18 parks, Post &amp; Pour and The Retreat’s 2027 opening — checked a month ago.</div><div class="small" style="display:flex;flex-direction:column;gap:6px">${Object.keys(SRC).map(k => srcLink(k)).join('')}</div><div class="d small muted">Guides are built once. Each month the Concierge re-checks its sources; in production the server compares each page and drafts any change for you.</div><div class="acts"><button class="btn" data-act="recheck-ok" data-id="${x.id}">Still accurate</button><a class="btn text" href="#desk-facts">Edit facts</a></div></div>`;
    if (x.type === 'integration') return `<div class="decision"><div class="eyebrow">A connection to renew</div><div class="t">${esc(x.title)}.</div><div class="d">${esc(x.detail)}</div><div class="acts"><button class="btn" data-act="reconnect" data-id="${x.id}">Reconnect &amp; resume</button></div></div>`;
    return `<div class="decision"><div class="eyebrow">${esc(x.title)}</div><div class="t">${esc(x.detail)}</div><div class="acts"><button class="btn" data-act="resolve" data-id="${x.id}">I’ve handled it</button></div></div>`;
  }
  const a = d.a;
  if (a.kind === 'reply.seller_judgment') {
    const q = L().questions.find(q => 'reply:' + q.id === a.key);
    return `<div class="decision"><div class="eyebrow">A question from your seller</div><div class="t">“${esc(q ? q.text : a.label)}”</div>
      <form data-form="reply" data-id="${a.id}"><div class="field"><label for="r-${a.id}">Your reply</label><textarea id="r-${a.id}" name="text" required>${esc(ui['draft-' + a.id] || '')}</textarea></div>
      <div class="acts"><button class="btn">Send reply</button>${caps.sample ? `<button type="button" class="btn text" data-act="draft" data-id="${a.id}">Draft it for me</button>` : ''}<button type="button" class="btn text" data-act="call" data-id="${a.id}">Call instead</button></div></form></div>`;
  }
  if (a.kind === 'price.change') return `<div class="decision"><div class="eyebrow">A price change</div><div class="t">${esc(a.label)}.</div><div class="d">${esc(a.detail)}</div><div class="acts"><button class="btn" data-act="approve" data-id="${a.id}">Approve</button><button class="btn text" data-act="decline" data-id="${a.id}">Decline</button></div></div>`;
  return `<div class="decision"><div class="eyebrow">Needs your approval</div><div class="t">${esc(a.label)}</div><div class="d">${esc(a.reason || a.detail)}</div><div class="acts"><button class="btn" data-act="approve" data-id="${a.id}">Approve</button><button class="btn text" data-act="decline" data-id="${a.id}">Decline</button></div></div>`;
}
function desk() {
  const l = L(), ds = decisions(), n = ds.length;
  const words = ['Nothing needs you.', 'One decision is yours.', 'Two decisions are yours.', 'Three decisions are yours.'];
  const r = E.report(LID);
  const lead = { signed: 'A new listing.', preparing: 'Preparing the launch.', coming_soon: 'Coming soon — quietly building interest.', marketing_ready: 'Ready to launch. Waiting on a verified NWMLS status.',
    active: 'Launching now.', market_engagement: r.metrics[0].value >= 30 ? 'Interest is strong.' : 'Live and working.', temp_off_market: 'Paused off market.', under_contract: 'Under contract. Transaction updates are flowing.',
    closed: 'Closed. Reviews and referrals are in motion.', withdrawn: 'Withdrawn.', canceled: 'Canceled.', expired: 'Expired.' }[l.state];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const acts = l.audit.filter(a => a.kind === 'action');
  const todays = acts.filter(a => a.at >= today.getTime());
  const s = l.saved;
  return deskShell('desk', `<div class="narrow" style="padding:0">
  <p class="say">${esc(lead)} ${n <= 3 ? words[n] : n + ' decisions are yours.'}</p>
  <form data-form="tell" class="tell"><label for="tell" class="eyebrow">Tell the Concierge</label><div class="tellrow"><input id="tell" name="q" placeholder="Schedule an open house Saturday, 1–4 pm" autocomplete="off"><button class="btn" ${ui.busy === 'tell' ? 'disabled' : ''}>${ui.busy === 'tell' ? '…' : 'Go'}</button></div>
    <div class="chips" style="margin-top:10px">${['What needs me today?', 'How is the listing doing?', 'Send my seller a quick update', 'Open house next Saturday 1–4 pm'].map(q => `<button type="button" class="chip" data-act="tell-q" data-q="${q}">${q}</button>`).join('')}</div></form>
  ${n ? `<div class="decisions">${ds.slice(0, 2).map(decisionCard).join('')}</div>${n > 2 ? `<details style="margin-top:20px"><summary class="btn ghost" style="display:inline-flex">${n - 2} more</summary><div class="decisions" style="margin-top:20px">${ds.slice(2).map(decisionCard).join('')}</div></details>` : ''}`
    : `<div class="decision" style="margin-top:40px"><div class="t">All quiet. The Concierge is handling the rest.</div><div class="d">You’ll see something here only when a fact conflicts, a judgment call is needed, a connection breaks, or pricing and contracts are involved.</div></div>`}
  ${suggestionsBlock()}
  ${buyersBlock()}
  ${followersBlock()}
  <div class="quiet" style="margin-top:56px"><div><div class="serif">${todays.length || acts.length} things handled ${todays.length ? 'today' : 'so far'}</div><div class="small muted" style="margin-top:8px">${acts.slice(0, 3).map(a => esc(a.text)).join(' · ') || 'Nothing yet'}</div></div><a href="#desk-runs" class="small">See how it ran</a></div>
  <div class="quiet"><span class="small">Seller access code · <b style="letter-spacing:.08em">${esc(l.sellers[0].code)}</b> <button class="btn text small" data-act="copy-invite">Copy invitation</button></span>
    <span class="small">Time given back · <span class="serif" style="font-size:20px">${Math.round(s.minutes / 6) / 10} hours</span> <span class="muted">(${s.clicks} clicks · ${s.tabs} tabs · estimated)</span></span></div>
  <div class="quiet" style="padding-bottom:80px"><span class="small muted">Presentation</span><span class="seg" role="group" aria-label="Story presentation">${[['heritage', 'Warm Heritage'], ['arch', 'Modern Architectural'], ['editorial', 'Estate Editorial']].map(([k, n]) => `<button data-act="mode" data-v="${k}" aria-pressed="${l.mode === k}">${n}</button>`).join('')}</span></div>
  </div>`);
}
function buyersBlock() {
  const l = L();
  const open = l.leads.filter(d => !d.demo && (d.kind === 'showing' || d.kind === 'valuation') && ['new', 'delivered', 'pending'].indexOf(d.status) >= 0).slice(0, 4);
  const shows = (l.showings || []).filter(s => s.status === 'scheduled').slice(0, 3);
  if (!open.length && !shows.length) return '';
  return `<div style="margin-top:56px"><h2 class="serif" style="font-size:26px;margin:0 0 4px">Buyers</h2><p class="small muted" style="margin:0 0 14px">Each already has an instant reply. You’re reminded after a day if no one has reached them.</p>
  <div class="rules">${open.map(d => `<div class="rulerow"><div><div>${esc(d.name || 'A visitor')} · ${esc(d.kind)}</div><div class="small muted">${esc(d.contact)} · via ${esc(d.source)} · ${ago(d.at)}${d.when ? ' · prefers ' + esc(d.when) : ''}</div></div>
    <span style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end"><button class="btn ghost" style="min-height:40px;padding:0 12px" data-act="lead-contacted" data-id="${d.id}">Reached</button>${d.kind === 'showing' ? `<button class="btn" style="min-height:40px;padding:0 12px" data-act="lead-confirm" data-id="${d.id}">Confirm a time</button>` : ''}</span></div>`).join('')}
  ${shows.map(s => { const d = l.leads.find(x => x.id === s.lead) || {}; return `<div class="rulerow"><div><div>Showing · ${esc(s.label)}</div><div class="small muted">${esc(d.name || '')} · feedback is requested automatically two hours after</div></div><button class="btn ghost" style="min-height:40px;padding:0 12px" data-act="fb-open" data-id="${s.id}">Log feedback</button></div>`; }).join('')}</div></div>`;
}
function deskFacts() {
  const l = L(), a = E.assets(LID);
  const chip = s => s === 'verified' ? '<span class="tag ok">Verified</span>' : s === 'removed' ? '<span class="tag warn">Removed</span>' : s === 'conflict' ? '<span class="tag acc">Conflict</span>' : '<span class="tag mute">Pending</span>';
  return deskShell('desk-facts', `<div style="padding:40px 0 80px"><h2 class="serif" style="font-size:34px;margin:0 0 6px">The fact record</h2><p class="muted" style="margin:0 0 24px">One source of truth. Edit a fact and every page, email, post and flyer rebuilds. Unverified claims can’t be published.</p>
  <div class="scroll"><table class="tbl" style="min-width:680px"><thead><tr><th>Claim</th><th>Value</th><th>Source</th><th>Status</th><th></th></tr></thead><tbody>
  ${l.facts.map(f => ui.editing === 'f:' + f.key ? `<tr><td colspan="5"><form data-form="fact" data-k="${f.key}" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;align-items:end">
      <div class="field" style="margin:0"><label for="fv">${esc(f.label)}</label><input id="fv" name="value" value="${esc(f.value == null ? '' : f.value)}"></div>
      <div class="field" style="margin:0"><label for="fs">Status</label><select id="fs" name="status">${['verified', 'pending', 'removed'].map(s => `<option ${f.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
      <div class="field" style="margin:0"><label for="fo">Source</label><input id="fo" name="source" value="${esc(f.source)}"></div>
      <div style="display:flex;gap:8px"><button class="btn">Save</button><button type="button" class="btn text" data-act="edit" data-v="">Cancel</button></div></form></td></tr>`
    : `<tr><td>${esc(f.label)}</td><td style="${f.status === 'removed' ? 'text-decoration:line-through;color:var(--muted)' : ''}">${esc(f.status === 'conflict' ? 'Hidden until confirmed' : E.formatValue(f))}${f.note ? `<div class="small muted">${esc(f.note)}</div>` : ''}</td><td class="muted">${esc(f.source)}</td><td>${chip(f.status)}</td><td style="white-space:nowrap">${f.status === 'pending' ? `<button class="btn text" data-act="verify" data-k="${f.key}">Verify</button>` : ''}<button class="btn text" data-act="edit" data-v="f:${f.key}">Edit</button></td></tr>`).join('')}
  </tbody></table></div>
  <div class="preview" style="margin-top:28px"><div class="eyebrow" style="margin-bottom:8px">Add facts from notes</div><p class="small muted" style="margin:0 0 12px">Paste seller notes, a disclosure or an email. Claude pulls out checkable facts; each arrives as pending and publishes only after you verify it.</p>
    <form data-form="intake"><div class="field"><label for="in">Notes</label><textarea id="in" name="text" placeholder="Roof replaced in 2023. New water heater last spring…"></textarea></div><button class="btn ghost" ${!caps.sample || ui.busy === 'intake' ? 'disabled' : ''}>${ui.busy === 'intake' ? 'Reading…' : caps.sample ? 'Read with Claude' : 'Needs Claude (open on claude.ai)'}</button></form></div>
  <h3 class="serif" style="font-size:26px;margin:48px 0 14px">Generated from these facts, right now</h3>
  <div class="runs"><div class="preview"><div class="eyebrow" style="margin-bottom:8px">MLS-style remarks</div>${esc(a.remarks)}</div>
    <div class="preview"><div class="eyebrow" style="margin-bottom:8px">Social</div>${a.social.map(p => `<p style="margin:0 0 10px"><b>${p.network}:</b> ${esc(p.text)}</p>`).join('')}</div>
    <div class="preview"><div class="eyebrow" style="margin-bottom:8px">Open-house talking points</div>${a.talkingPoints.map(t => `<p style="margin:0 0 8px">— ${esc(t)}</p>`).join('')}</div></div></div>`);
}
function deskActivity() {
  const l = L();
  return deskShell('desk-activity', `<div style="padding:40px 0 80px;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,460px),1fr));gap:40px">
  <div><h2 class="serif" style="font-size:30px;margin:0 0 6px">Everything the Concierge did</h2><p class="muted small" style="margin:0 0 16px">Each line records what happened, why, and what the outside system confirmed.</p>
    <div class="log">${l.audit.slice(0, 80).map(a => `<div><span class="k">${esc(a.kind)}</span><span>${esc(a.text)}<div class="small muted">${ago(a.at)}${a.data && a.data.providerId ? ' · confirmation ' + esc(a.data.providerId) : ''}</div></span></div>`).join('') || '<p class="muted">Nothing yet.</p>'}</div></div>
  <div><h2 class="serif" style="font-size:30px;margin:0 0 6px">Messages</h2><p class="muted small" style="margin:0 0 16px">Marked delivered only when the provider confirms. Simulated providers in this prototype.</p>
    <div class="log">${l.outbox.slice(0, 40).map(m => `<div><span class="k">${esc(m.channel)}</span><span><b>${esc(m.subject)}</b> → ${esc(m.to)}<div class="small muted">${esc(m.status)} · ${esc(m.providerId)} · ${ago(m.at)}${m.gmail ? (m.gmail.url ? ` · <a href="${esc(m.gmail.url)}" target="_blank" rel="noopener">Gmail draft ↗</a>` : m.gmail.error ? ' · Gmail draft failed' : ' · Gmail draft') : ''}</div></span></div>`).join('') || '<p class="muted">No messages yet.</p>'}</div>
    <h2 class="serif" style="font-size:30px;margin:40px 0 16px">Requests</h2>
    <div class="log">${l.leads.slice(0, 30).map(d => `<div><span class="k">${esc(d.kind)}</span><span>${esc(d.name || 'Visitor')} · ${esc(d.contact)}<div class="small muted">via ${esc(d.source)}/${esc(d.cta)} · consent ${d.consent ? 'yes' : 'no'} · ${esc(d.status)}${d.demo ? ' · sample' : ''} · ${ago(d.at)}</div></span></div>`).join('') || '<p class="muted">No requests yet.</p>'}</div></div></div>`);
}
function deskRun() {
  const l = L(), st = l.state;
  const run = (t, d, act, extra, dis) => `<div class="run"><div class="t">${t}</div><div class="d">${d}</div><button class="btn ghost" data-act="${act}" ${extra || ''} ${dis ? 'disabled' : ''}>Run</button></div>`;
  const live = ['active', 'market_engagement'].indexOf(st) >= 0;
  return deskShell('desk-run', `<div style="padding:40px 0 80px"><h2 class="serif" style="font-size:34px;margin:0 0 6px">Run the scenario</h2>
  <p class="muted" style="margin:0 0 28px;max-width:62ch">These buttons stand in for the outside world — the NWMLS feed, buyers, the calendar. Everything that follows is the Concierge working on its own, under your rules. Current state: <b>${esc(LC.STATES[st])}</b>.</p>
  <div class="runs">
  ${run('NWMLS reports “Active” (verified)', 'The real trigger. Without your authorization, it waits for you on The Desk.', 'sim-mls', 'data-v="Active"', ['marketing_ready', 'coming_soon', 'temp_off_market', 'under_contract', 'withdrawn'].indexOf(st) < 0)}
  ${run('A rumor says it’s live (unverified)', 'An unverified status change. The Concierge ignores it and launches nothing.', 'sim-mls-unverified')}
  ${run('Load a sample week', 'Adds clearly labeled sample visits, scans and showing requests so the weekly report has something to show.', 'sim-week')}
  ${run('A buyer requests a showing', 'Opens the buyer’s tour form on the story, as a buyer would.', 'sim-tour', '', !live)}
  ${run('Your seller asks a judgment question', '“Should we hold offers until after the second open house?” — goes to you, never answered by AI.', 'sim-question')}
  <div class="run"><div class="t">Schedule an open house</div><div class="d">The seller approves it in their portal; then the kit, posts and sign assignment happen automatically.</div>
    <form data-form="schedule-oh" style="display:flex;flex-direction:column;gap:8px"><div class="field" style="margin:0"><label for="od">Date</label><input id="od" type="date" name="date" required></div>
    <div class="field" style="margin:0"><label for="ot">Time</label><select id="ot" name="time"><option>11 am – 1 pm</option><option selected>1 – 4 pm</option><option>2 – 4 pm</option></select></div><button class="btn ghost" ${!live ? 'disabled' : ''}>Request</button></form></div>
  ${run('Send this week’s report', 'Built only from first-party data. Run it twice — it still sends once.', 'sim-report', '', !live)}
  ${run('Social sign-in expires', 'The next posts fail, retry three times, then pause and come to you. Nothing posts twice.', 'sim-outage')}
  ${run('Request a price change to $760,000', 'Price never changes without you.', 'sim-price', '', !live)}
  ${run('NWMLS reports “Pending”', 'Marketing quiets; the seller gets the under-contract roadmap.', 'sim-mls', 'data-v="Pending"', !live)}
  ${run('NWMLS reports “Sold”', 'Closing recap, then an honest review invitation to every seller — no filtering.', 'sim-mls', 'data-v="Sold"', st !== 'under_contract')}
  ${run('Temporarily off market', 'The story goes private; relaunching later starts a fresh cycle.', 'sim-mls', 'data-v="Temporarily Off Market"', !live)}
  ${run('An offer arrives', 'You’re alerted at once. The seller hears only after you approve — and never the terms.', 'sim-offer', '', !live)}
  <div class="run"><div class="t">Skip ahead in time</div><div class="d">Watch the clock work: follow-ups, reminders, the Friday report, monthly checks. Now: <b>${when(E.now())}</b></div>
    <div style="display:flex;flex-wrap:wrap;gap:8px"><button class="btn ghost" data-act="clock" data-v="3600000">+1 hour</button><button class="btn ghost" data-act="clock" data-v="86400000">+1 day</button><button class="btn ghost" data-act="clock" data-v="friday">Friday 9 am</button><button class="btn ghost" data-act="clock" data-v="604800000">+1 week</button></div></div>
  ${run('Start over', 'Resets this demonstration listing to “Marketing ready.”', 'sim-reset')}
  </div><p class="small muted" style="margin-top:26px">Seller portal: open <a href="#seller">#seller</a> and enter code <b>${esc(l.sellers[0].code)}</b>. Field: <a href="#host">open house host</a> · <a href="#sign">reusable sign</a>.</p></div>`);
}

function deskRuns() {
  const l = L();
  const icon = { done: ['✓', 'var(--ok)', ''], held: ['◷', 'var(--accent)', 'Waiting'], blocked: ['⊘', 'var(--muted)', 'Stopped'], dupe: ['↺', 'var(--muted)', 'Not repeated'], failed: ['✕', 'var(--warn)', 'Failed safely'], desk: ['→', 'var(--accent)', 'Your Desk'], state: ['◆', 'var(--ink)', 'Journey'], note: ['·', 'var(--muted)', ''] };
  const runs = l.runs || [];
  const card = r => `<article class="runcard"><div class="rh"><span class="who">${esc(r.who)}</span><span>${ago(r.at)}</span></div><h3 class="rt">${esc(r.trigger)}</h3>
    <ol class="steps">${r.steps.map(st => { const ic = icon[st.type] || icon.note; return `<li><span class="ic" style="color:${ic[1]}" aria-hidden="true">${ic[0]}</span><div><div>${esc(st.text)}</div>${st.rule || st.proof ? `<div class="small muted">${st.rule && st.rule.words ? 'Rule: ' + esc(st.rule.words) : ''}${st.rule && st.rule.words && st.proof ? ' · ' : ''}${st.proof ? 'Confirmed ' + esc(st.proof) : ''}</div>` : ''}</div></li>`; }).join('')}</ol></article>`;
  const kinds = ['publish.story', 'send.seller_live', 'post.social', 'send.agent_network', 'notify.agent', 'send.seller_update', 'send.seller_report', 'send.guest_followup', 'send.review_invite', 'openhouse.schedule', 'route.vendor', 'price.change', 'reply.seller_judgment', 'mls.change'];
  const rule = k => { const p = E.policyOf(k), adj = LC.ADJUSTABLE[k], locked = LC.LOCKED.indexOf(k) >= 0;
    return `<div class="rulerow"><div><div>${esc(LC.KIND_WORDS[k] || k)}</div><div class="small muted">${esc(LC.POLICY_WORDS[p])}${locked ? ' · always' : ''}</div></div>
    ${adj ? `<span class="seg" role="group" aria-label="${esc(LC.KIND_WORDS[k])}">${adj.map(v => `<button data-act="policy" data-k="${k}" data-v="${v}" aria-pressed="${p === v}">${v === 'human' ? 'Ask me first' : v === 'authorized' ? 'If authorized' : 'On its own'}</button>`).join('')}</span>` : `<span class="small muted" aria-label="Locked">Locked</span>`}</div>`; };
  const clock = [['Fridays, 9 am', 'Weekly report to your seller', E.policyOf('send.seller_report')], ['An hour after an open house', 'Follow-ups to guests who agreed', 'consent'],
['When a request sits a day', 'A nudge to you, never to the buyer', 'auto'], ['Two hours after a showing', 'Ask the buyer’s agent for feedback', 'auto'], ['Two days before each contract date', 'A reminder to your seller', 'auto'], ['Monthly', 'Re-verify neighborhood facts — trails, parks, clubhouse dates', 'auto'], ['Home anniversary', 'A personal note and equity update to past sellers', 'human']];
  return deskShell('desk-runs', `<div class="narrow" style="padding:0 0 80px">
  <p class="say">Something happens. One of your rules decides. The Concierge acts — and proves it.</p>
  <div class="how3"><div><div class="eyebrow">1 · Something happens</div><p>NWMLS changes a status, a buyer asks for a tour, a seller has a question, the clock hits Friday.</p></div>
    <div><div class="eyebrow">2 · Your rule decides</div><p>Runs on its own, waits for you, waits for the seller, or needs the person’s consent.</p></div>
    <div><div class="eyebrow">3 · Proof</div><p>Nothing is marked done until the service that did it confirms. Nothing ever happens twice.</p></div></div>
  <h2 class="serif" style="font-size:30px;margin:56px 0 6px">As it happened</h2><p class="small muted" style="margin:0 0 18px">Newest first. ${runs.length ? '' : 'Nothing yet — try <a href="#desk-run">Run the scenario</a>.'}</p>
  ${runs.slice(0, 10).map(card).join('')}
  ${runs.length > 10 ? `<details><summary class="btn ghost" style="display:inline-flex;margin-top:12px">${runs.length - 10} earlier</summary>${runs.slice(10).map(card).join('')}</details>` : ''}
  <h2 class="serif" style="font-size:30px;margin:64px 0 6px">Your rules</h2><p class="small muted" style="margin:0 0 14px">What the Concierge may do on its own. Guardrails stay locked, whatever is switched.</p>
  <div class="rules">${kinds.map(rule).join('')}</div>
  <h2 class="serif" style="font-size:30px;margin:64px 0 6px">Coming up</h2><p class="small muted" style="margin:0 0 14px">Queued by the Concierge. Each runs on time and catches up if the app was closed. Want to watch? <a href="#desk-run">Skip ahead in time</a>.</p>
  <div class="rules">${(l.jobs || []).filter(j => !j.done).sort((a, b) => a.due - b.due).slice(0, 10).map(j => `<div class="rulerow"><div>${esc(j.label)}</div><span class="small" style="white-space:nowrap">${when(j.due)}</span></div>`).join('') || '<div class="rulerow"><div class="muted">Nothing queued yet — it fills up once the home is live.</div></div>'}</div>
  <h3 class="serif" style="font-size:22px;margin:40px 0 10px">The rhythm</h3>
  <div class="rules">${clock.map(([w, t, p]) => `<div class="rulerow"><div><div>${esc(t)}</div><div class="small muted">${esc(LC.POLICY_WORDS[p] || '')}</div></div><span class="small" style="white-space:nowrap">${esc(w)}</span></div>`).join('')}</div>
  </div>`);
}

function setup() {
  const t = T(), l = L(), s = l.sellers[0], st = settings(), c = conn();
  const qs = [['post.social', 'Social posts about your listings', 'Post on their own', 'Show me first'], ['send.agent_network', 'Announcements to the agent network', 'Send on their own', 'Show me first'],
    ['send.seller_report', 'The weekly report to your seller', 'Send on its own', 'Show me first'], ['send.seller_update', 'Routine updates to your seller', 'Send on their own', 'Show me first'], ['send.seller_live', 'The “you’re live” message', 'Send if the seller agreed', 'Show me first']];
  const badge = (ok, text) => `<span class="tag ${ok === true ? 'ok' : ok === false ? 'warn' : 'mute'}">${text}</span>`;
  const row = (name, status, note, btn) => `<div class="rulerow"><div><div>${name} ${status}</div><div class="small muted" style="margin-top:4px">${note}</div></div>${btn || ''}</div>`;
  return deskShell('setup', `<div class="narrow" style="padding:0 0 90px">
  <p class="say">Set it up once. The Concierge follows it everywhere.</p>
  <h2 class="serif setuph">1 · Your brokerage</h2>
  <form data-form="brokerage" class="setupform"><div class="field"><label for="bn">Brokerage or team name</label><input id="bn" name="name" value="${esc(t.name)}"></div>
    <div class="field"><label for="ba">Affiliation shown beside it</label><input id="ba" name="affiliation" value="${esc(t.affiliation)}"></div>
    <div class="field"><label for="an">Listing agent</label><input id="an" name="agentName" value="${esc(t.agent.name)}"></div>
    <div class="field"><label for="ae">Agent email (for alerts)</label><input id="ae" name="agentEmail" type="email" value="${esc(t.agent.email || '')}"></div><button class="btn">Save</button></form>
  <h2 class="serif setuph">2 · How you like to work</h2><p class="small muted">Plain choices. Change them any time; every action follows them from that moment on.</p>
  <div class="rules">${qs.map(([k, q, a, b]) => { const p = E.policyOf(k), av = LC.ADJUSTABLE[k][0]; return `<div class="rulerow"><div>${q}</div><span class="seg" role="group" aria-label="${esc(q)}"><button data-act="policy" data-k="${k}" data-v="${av}" aria-pressed="${p === av}">${a}</button><button data-act="policy" data-k="${k}" data-v="human" aria-pressed="${p === 'human'}">${b}</button></span></div>`; }).join('')}</div>
  <h2 class="serif setuph">3 · Always on</h2><p class="small muted">Guardrails every brokerage gets. They can’t be switched off.</p>
  <div class="list">${['Price never changes without you', 'Nothing launches without a verified NWMLS status and your go-live', 'Pricing, offers and strategy questions always come to you', 'Follow-ups only go to people who agreed', 'Unverified or removed claims never publish', 'Nothing is sent twice; nothing counts as sent until the service confirms', 'Places are described, never the people who live there'].map(x => `<div><span aria-hidden="true">🔒</span><span>${x}</span></div>`).join('').replace(/🔒/g, '—')}</div>
  <h2 class="serif setuph">4 · Your seller</h2>
  <form data-form="seller-setup" class="setupform"><div class="field"><label for="sn2">Seller name(s)</label><input id="sn2" name="name" value="${esc(s.name === 'Seller' ? '' : s.name)}" placeholder="e.g. Jordan and Alex"></div>
    <div class="field"><label for="se">Seller email</label><input id="se" name="email" type="email" value="${esc(s.email || '')}"></div>
    <label class="check"><input type="checkbox" name="launch" ${s.authorized.launch_comms ? 'checked' : ''}> The seller agreed to receive launch and progress messages</label>
    <div class="field"><label for="tn2">How we write to them</label><select id="tn2" name="tone"><option value="celebratory" ${s.tone === 'celebratory' ? 'selected' : ''}>Celebratory</option><option value="quiet" ${s.tone === 'quiet' ? 'selected' : ''}>Quiet — for a sensitive move</option></select></div>
    <p class="small">Private access code: <b>${esc(s.code)}</b> <button type="button" class="btn text small" data-act="copy-invite">Copy invitation</button></p><button class="btn">Save</button></form>
  <h2 class="serif setuph">5 · Connections</h2><p class="small muted">These use your own claude.ai connectors and your own sign-in. Nothing is sent from your accounts without your rules allowing it.</p>
  <div class="rules">
  ${row('Google Drive', c.drive ? (c.drive.error ? badge(false, 'Not reached') : badge(true, 'Connected')) : badge(null, 'Not checked'), c.drive && !c.drive.error ? `${c.drive.count} photos in “19917-145th-St-E” · ${c.drive.used} in the story · checked ${ago(c.drive.at)}${c.drive.unused && c.drive.unused.length ? ' · not used: ' + c.drive.unused.length + ' (e.g. unfinished storage)' : ''}` : esc((c.drive && c.drive.error) || 'Finds and organizes listing photography automatically.'), caps.mcp ? `<button class="btn ghost" data-act="check-drive" ${ui.busy === 'drive' ? 'disabled' : ''}>${ui.busy === 'drive' ? 'Checking…' : 'Check now'}</button>` : '')}
  ${row('Gmail', st.gmail === 'drafts' ? badge(true, 'Drafts on') : badge(null, 'Off'), st.gmail === 'drafts' ? (s.email ? 'Every message to your seller lands in your Gmail drafts — you press send.' : 'Add the seller’s email above to start.') : 'Turn on to have seller messages written into your Gmail drafts for you to send.', caps.mcp ? `<span class="seg"><button data-act="gmail" data-v="off" aria-pressed="${st.gmail !== 'drafts'}">Off</button><button data-act="gmail" data-v="drafts" aria-pressed="${st.gmail === 'drafts'}">Drafts</button></span>` : '')}
  ${row('Metricool (social)', c.metricool ? (c.metricool.error ? badge(false, 'Not reached') : badge(true, 'Connected')) : badge(null, 'Not checked'), c.metricool && !c.metricool.error ? c.metricool.brands + ' brand account' + (c.metricool.brands === 1 ? '' : 's') + ' found · posting stays simulated until we confirm your plan supports review-before-publish' : esc((c.metricool && c.metricool.error) || 'Schedules social posts for review before they publish.'), caps.mcp ? `<button class="btn ghost" data-act="check-metricool" ${ui.busy === 'metricool' ? 'disabled' : ''}>${ui.busy === 'metricool' ? 'Checking…' : 'Check now'}</button>` : '')}
  ${row('NWMLS status feed', badge(null, 'Not connected'), 'Needs an approved data feed (IDX/VOW or vendor) and NWMLS rules review. The scenario button stands in.')}
  ${row('Showings', badge(null, 'Not connected'), 'ShowingTime or similar — requests, feedback and confirmations.')}
  ${row('KW Command (CRM)', badge(null, 'Not connected'), 'Every lead copied into Command with source and consent.')}
  ${row('Claude', caps.sample ? badge(true, 'On') : badge(null, 'Unavailable here'), 'Answers questions from verified facts, reads notes into pending facts, suggests next moves, drafts replies.')}
  ${row('Shared database', caps.db ? badge(true, 'On') : badge(null, 'This browser only'), 'Keeps the Desk, seller portal and phone in sync.')}
  </div>
  ${caps.mcp ? '' : '<p class="small muted" style="margin-top:14px">Connections light up when this page has your permission to use your connectors. Open it from claude.ai and approve the prompt.</p>'}
  <h2 class="serif setuph">6 · Presentation</h2>
  <div class="rulerow" style="border-top:1px solid var(--line)"><div>How this home’s story looks</div><span class="seg" role="group" aria-label="Story presentation">${[['heritage', 'Heritage'], ['arch', 'Architectural'], ['editorial', 'Editorial']].map(([k, n]) => `<button data-act="mode" data-v="${k}" aria-pressed="${l.mode === k}">${n}</button>`).join('')}</span></div>
  <div style="margin-top:40px"><a class="btn" href="#desk">Done — back to The Desk</a></div></div>`);
}
function ruleSuggestions() {
  const l = L(), r = E.report(LID), v = r.metrics[0].value, sh = r.metrics[1].value, out = [];
  const live = ['active', 'market_engagement'].indexOf(l.state) >= 0;
  if (live && v >= 100 && sh / Math.max(1, v) < 0.02) out.push({ title: 'Lead with the deck instead of the great room', why: v + ' visits but only ' + sh + ' showing requests. Test a different first impression before anything else.', action: 'lead-photo', photo: 'deck-fire' });
  if (live && !l.openHouses.some(o => o.status === 'scheduled' || o.status === 'awaiting_seller')) out.push({ title: 'Hold an open house this weekend', why: 'No open house is on the calendar. Weekends drive the most visits in Tehaleh.', action: 'open-house' });
  const last = l.updates[0];
  if (live && (!last || Date.now() - last.at > 4 * 864e5)) out.push({ title: 'Send your seller a quick note', why: last ? 'It’s been ' + Math.floor((Date.now() - last.at) / 864e5) + ' days since they heard from you.' : 'They haven’t had a personal note yet.', action: 'seller-note' });
  if (!live && l.state === 'marketing_ready') out.push({ title: 'Everything is ready for launch', why: 'Photos, facts and story are approved. The moment NWMLS shows Active and you authorize it, launch runs itself.', action: 'none' });
  return out.slice(0, 3);
}
function suggestionsBlock() {
  const list = ui.suggest || ruleSuggestions();
  if (!list.length) return '';
  return `<div style="margin-top:56px"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap"><h2 class="serif" style="font-size:26px;margin:0">The Concierge suggests</h2>
    ${caps.sample ? `<button class="btn text small" data-act="suggest" ${ui.busy === 'suggest' ? 'disabled' : ''}>${ui.busy === 'suggest' ? 'Thinking…' : 'Think it through with Claude'}</button>` : ''}</div>
    <p class="small muted" style="margin:6px 0 16px">${ui.suggest ? 'From Claude, reading this listing’s activity. ' : ''}Suggestions only — nothing happens unless you say so, and your rules still apply.</p>
    <div class="decisions" style="margin-top:0">${list.map((x, i) => `<div class="decision"><div class="t" style="font-size:21px">${esc(x.title)}</div><div class="d">${esc(x.why)}</div>${x.action && x.action !== 'none' ? `<div class="acts"><button class="btn ghost" data-act="do-suggest" data-i="${i}">${x.action === 'lead-photo' ? 'Change the lead photo' : x.action === 'open-house' ? 'Pick a date' : x.action === 'seller-note' ? 'Write it for me' : 'Do it'}</button></div>` : ''}</div>`).join('')}</div></div>`;
}
async function aiSuggest() {
  ui.busy = 'suggest'; render();
  const l = L(), r = E.report(LID);
  try {
    const out = await caps.sample.json(`You are the Listing Concierge for ${street()} (${LC.STATES[l.state]}). Suggest up to 3 next moves for listing agent ${T().agent.name}.
Allowed actions ONLY: "lead-photo" (pick a different lead photo from: ${LC.MEDIA.filter(m => m.chapter > 0).slice(0, 20).map(m => m.id).join(', ')}), "open-house", "seller-note", "none".
Never suggest a price change or anything about who should live here. Be specific and brief.
ACTIVITY: ${r.summary}
OPEN HOUSES: ${l.openHouses.map(o => o.status + ' ' + o.label).join('; ') || 'none'}
LAST SELLER UPDATE: ${l.updates[0] ? Math.floor((Date.now() - l.updates[0].at) / 864e5) + ' days ago' : 'never'}
Return JSON: [{"title": string, "why": string, "action": one of the allowed, "photo": string if lead-photo}]`, { modelTier: 'default', cache: false });
    const ok = ['lead-photo', 'open-house', 'seller-note', 'none'];
    const list = (Array.isArray(out) ? out : (out && out.suggestions) || []).filter(x => x && x.title && ok.indexOf(x.action) >= 0).map(x => ({ title: String(x.title).slice(0, 90), why: String(x.why || '').slice(0, 240), action: x.action, photo: M(x.photo) ? x.photo : 'deck-fire' })).slice(0, 3);
    ui.suggest = list.length ? list : null;
  } catch (e) { toast('Claude couldn’t weigh in right now — showing the Concierge’s own read.'); }
  ui.busy = null; render();
}
async function writeSellerNote() {
  const l = L(), r = E.report(LID);
  let text = 'A quick note: your home’s story is out there working. ' + r.summary + ' I’ll keep you posted — call me anytime.';
  if (caps.sample) { try { const o = await caps.sample(`Write a 3-sentence warm, specific note from listing agent ${T().agent.name} to the seller of ${street()}. Tone: ${l.sellers[0].tone === 'quiet' ? 'calm and understated' : 'upbeat'}. Use only these facts: ${r.summary}. No pricing advice. Plain text.`, { modelTier: 'quick', cache: false }); if (o.text) text = o.text.trim(); } catch (e) {} }
  sheet(`<div class="eyebrow">A note to your seller</div><h3>Edit, then send.</h3><form data-form="seller-note"><div class="field"><label for="nt">Message</label><textarea id="nt" name="text" style="min-height:170px">${esc(text)}</textarea></div><button class="btn wide">Send through the Concierge</button></form><p class="small muted">It follows your rule for seller updates${settings().gmail === 'drafts' ? ', and lands in your Gmail drafts' : ''}.</p>`);
}
async function readNotes(text) {
  if (!caps.sample) return toast('Reading notes needs Claude, which isn’t available in this view.');
  ui.busy = 'intake'; render();
  try {
    const out = await caps.sample.json(`Extract concrete, checkable property facts about ${street()} from the notes below. Only physical features, systems, upgrades with dates, HOA/utilities. No opinions, no people, no neighborhood demographics, nothing about schools beyond the district name.
Return JSON: [{"label": short name, "value": the fact as stated}] — at most 12.
NOTES:
${text.slice(0, 6000)}`, { modelTier: 'default', cache: false });
    const items = Array.isArray(out) ? out : (out && out.facts) || [];
    const added = E.proposeFacts(LID, items, 'pasted notes');
    toast(added.length ? added.length + ' facts added as pending — verify the ones you trust.' : 'No new checkable facts found.');
  } catch (e) { toast('Couldn’t read the notes right now.'); }
  ui.busy = null; render();
}

/* ---------- Tell the Concierge: plain English in, rule-checked actions out ---------- */
async function tell(q) {
  const done = [];
  const log = (name, res) => { done.push({ name, res }); return res; };
  const tools = [
    { name: 'listing_status', description: 'Current state, open decisions, this week’s activity and verified facts for the listing.', inputSchema: { type: 'object', properties: {} },
      execute: () => { const l = L(); return log('Looked at the listing', { state: LC.STATES[l.state], decisions: decisions().map(d => d.kind === 'ex' ? d.x.title : d.a.label), week: E.report(LID).summary, openHouses: l.openHouses.map(o => o.status + ' ' + o.label), lastSellerUpdateDaysAgo: l.updates[0] ? Math.floor((Date.now() - l.updates[0].at) / 864e5) : null, facts: l.facts.filter(f => f.status === 'verified').map(f => f.label + ': ' + E.formatValue(f)) }); } },
    { name: 'schedule_open_house', description: 'Request an open house. The seller must approve it in their portal before anything is promoted.', inputSchema: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD' }, time: { type: 'string', description: 'e.g. 1 – 4 pm' } }, required: ['date', 'time'] },
      execute: ({ date, time }) => { const d = new Date(date + 'T12:00:00'); if (isNaN(d) || d < new Date(Date.now() - 864e5)) throw new Error('Pick a future date'); const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + time; E.emit(LID, 'openhouse.requested', { start: d.getTime(), label }); return log('Open house requested · ' + label, 'Sent to the seller for approval'); } },
    { name: 'send_seller_note', description: 'Send the seller a short note. Follows the brokerage rule for seller updates (may wait for approval).', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
      execute: ({ text }) => { const r = E.emit(LID, 'seller.note', { text: String(text).slice(0, 1200) }); return log('Note to seller', r.pending ? 'Waiting for your approval, per your rule' : r.ok ? 'Sent' : 'Not sent'); } },
    { name: 'set_lead_photo', description: 'Change the photo the Property Story leads with.', inputSchema: { type: 'object', properties: { photo: { type: 'string', enum: LC.MEDIA.map(m => m.id) } }, required: ['photo'] },
      execute: ({ photo }) => { if (!M(photo)) throw new Error('Unknown photo'); E.setLeadPhoto(LID, photo, 'asked of the Concierge'); return log('Lead photo → ' + M(photo).room, 'Done'); } },
    { name: 'request_price_change', description: 'Request a list price change. It is NEVER applied directly: it goes to The Desk for the agent to approve.', inputSchema: { type: 'object', properties: { to: { type: 'number' } }, required: ['to'] },
      execute: ({ to }) => { if (!(to > 50000)) throw new Error('Invalid price'); E.emit(LID, 'price.change.requested', { to: Math.round(to) }); return log('Price change to ' + LC.money(to), 'Waiting for your approval on The Desk'); } },
    { name: 'add_pending_facts', description: 'Add property facts the agent stated. They are added as PENDING and publish only after verification.', inputSchema: { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' } } } } }, required: ['items'] },
      execute: ({ items }) => { const a = E.proposeFacts(LID, items, 'your instruction'); return log(a.length + ' fact(s) added as pending', 'Verify them on the Facts tab'); } }
  ];
  ui.busy = 'tell'; render();
  let answer = '';
  try {
    const out = await caps.sample([{ role: 'user', content: `You are the Listing Concierge for ${street()}, working for listing agent ${T().agent.name} of ${T().name}. Today is ${new Date().toDateString()}.
Do what the agent asks using ONLY the tools. Call listing_status first when you need context. Never say something happened unless a tool returned it. Price changes and anything about offers or negotiation stay with the agent. Never describe who lives in the area. Reply in 1–3 short, plain sentences.
AGENT: ${q}` }], { tools, modelTier: 'default', cache: false });
    answer = (out.text || '').trim();
  } catch (e) { answer = e && e.code === 'rate_limited' ? 'I’m being asked too much at once — try again in a moment.' : 'I couldn’t reach Claude just now.'; }
  ui.busy = null; render();
  sheet(`<div class="eyebrow">Your Concierge</div><h3 style="font-size:24px">${esc(q)}</h3><p style="font-size:16px;line-height:1.6">${esc(answer)}</p>
    ${done.length ? `<div class="list" style="margin-top:14px">${done.map(d => `<div><span style="color:var(--ok)" aria-hidden="true">✓</span><span>${esc(d.name)}<div class="small muted">${esc(typeof d.res === 'string' ? d.res : 'Read the current listing record')}</div></span></div>`).join('')}</div>` : ''}
    <p class="small muted" style="margin-top:14px">Every action went through your rules. See it on <a href="#desk-runs" data-act="close">How it runs</a>.</p>`);
}
function tellOffline(q) {
  if (/(need|today|decision)/i.test(q)) { const ds = decisions(); return sheet(`<div class="eyebrow">Your Concierge</div><h3 style="font-size:24px">${ds.length === 0 ? 'Nothing needs you' : ds.length === 1 ? 'One thing needs you' : ds.length + ' things need you'}</h3>${ds.map(d => `<p>— ${esc(d.kind === 'ex' ? d.x.title : d.a.label)}</p>`).join('')}`); }
  if (/(how|doing|status|week)/i.test(q)) return sheet(`<div class="eyebrow">Your Concierge</div><h3 style="font-size:24px">This week</h3><p>${esc(E.report(LID).summary)}</p>`);
  if (/(seller|update|note)/i.test(q)) return writeSellerNote();
  if (/open house/i.test(q)) { location.hash = 'desk-run'; return; }
  toast('Full instructions need Claude — open this on claude.ai.');
}

/* ============================================================
   SYSTEM & TESTS
   ============================================================ */
let testResults = null;
function system() {
  if (!testResults) testResults = LCTests.run(LC);
  const pass = testResults.filter(r => r.pass).length;
  const groups = [...new Set(testResults.map(r => r.group))];
  const ten = t => `<div class="preview" style="padding:0;overflow:hidden;font-family:${t.brand.sans},sans-serif;background:${t.brand.ground};color:${t.brand.ink}">
    <div style="position:relative;height:200px;background:${t.brand.night}"><img src="${M('great-room').thumb}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.75">
    <div style="position:absolute;left:18px;bottom:14px;color:#fff;font-family:${t.brand.serif},serif;font-size:28px;line-height:1.05">A home that feels different.</div></div>
    <div style="padding:16px 18px"><div style="font-family:${t.brand.serif},serif;letter-spacing:.2em;font-size:13px;color:${t.brand.accent}">${esc(t.name.toUpperCase())}</div><div class="small" style="margin-top:4px">${esc(t.affiliation)}</div>
    <div class="small muted" style="margin-top:8px">Launch message: ${esc(t.policies['send.seller_live'])} · Social: ${esc(t.policies['post.social'])} · Price: ${esc(t.policies['price.change'])}</div></div></div>`;
  return deskShell('system', `<div style="padding:40px 0 80px">
  <div style="display:flex;flex-wrap:wrap;gap:24px;align-items:flex-end;justify-content:space-between"><div><h2 class="serif" style="font-size:34px;margin:0 0 6px">Pilot acceptance tests</h2><p class="muted" style="margin:0;max-width:60ch">The blueprint’s criteria, written as code and run just now in your browser against a fresh, isolated copy of the engine.</p></div>
    <div style="text-align:right"><div class="score">${pass}/${testResults.length}</div><button class="btn ghost" data-act="run-tests" style="margin-top:10px">Run again</button></div></div>
  <div style="margin-top:28px">${groups.map(g => `<h3 class="eyebrow" style="margin:28px 0 4px">${esc(g)}</h3>${testResults.filter(r => r.group === g).map(r => `<div class="result ${r.pass ? 'pass' : 'fail'}"><span class="ic" aria-label="${r.pass ? 'passed' : 'failed'}">${r.pass ? '✓' : '✕'}</span><div><div>${esc(r.name)}</div><div class="small muted">${esc(r.detail)}</div></div></div>`).join('')}`).join('')}</div>
  <h2 class="serif" style="font-size:30px;margin:64px 0 8px">Same code, another brokerage</h2><p class="muted" style="margin:0 0 20px">Brand, agents and approval rules are configuration. The second tenant is fictional and cannot read this listing.</p>
  <div class="runs">${ten(LC.TENANTS.ranch)}${ten(LC.TENANTS.northline)}</div>
  <h2 class="serif" style="font-size:30px;margin:64px 0 16px">What is real in this prototype</h2>
  <div class="scroll"><table class="tbl" style="min-width:620px"><thead><tr><th>Part</th><th>Here</th><th>For production</th></tr></thead><tbody>
  <tr><td>Photography</td><td>Real — 46 photos ingested from your Drive folder</td><td>Automatic Drive watch and ingestion</td></tr>
  <tr><td>Fact record, journey, rules, retries, audit</td><td>Real engine, tested above</td><td>Move to a server with a job queue</td></tr>
  <tr><td>Saving &amp; sync</td><td>${caps.db ? 'Real database — changes sync across your devices' : 'This browser only (database not available in this view)'}</td><td>Per-brokerage database with logins</td></tr>
  <tr><td>Concierge answers</td><td>${caps.sample ? 'Claude, grounded in verified facts; judgment questions go to you' : 'Rule-based answers from verified facts'}</td><td>Same, with brokerage-approved guardrails</td></tr>
  <tr><td>QR codes</td><td>Real, scannable, with permanent IDs</td><td>Short branded domain</td></tr>
  <tr><td>Email, social, NWMLS, showings</td><td>Simulated providers that confirm delivery</td><td>Approved adapters (subject to NWMLS rules)</td></tr>
  <tr><td>Zillow &amp; Redfin</td><td>Shown as unavailable — never estimated</td><td>Only if a legitimate feed exists</td></tr></tbody></table></div>
  <h2 class="serif" style="font-size:30px;margin:64px 0 16px">Data model</h2><p class="muted small">Brokerage · User · Listing · PropertyFact · MediaAsset · StoryChapter · Campaign · CampaignAsset · DistributionEvent · QRSign · QRScan · Lead · Showing · OpenHouse · SellerPortal · SellerCommunication · PerformanceMetric · Vendor · Referral · Approval · WorkflowRun · AuditEvent — each implemented here as a typed record in the listing document, owned by one tenant.</p></div>`);
}

/* ============================================================
   ROUTER
   ============================================================ */
const ROUTES = { following, 'closing-book': closingBook, 'home-book': homeBook, talkers: talkersView, 'desk-kit': deskKit, quick: quickSetup, present, story, tehaleh: guide, valuation, 'home-edit': homeEdit, between, seller: portal, reveal, report: reportView, host, sign: signView, desk, 'desk-runs': deskRuns, setup, 'desk-facts': deskFacts, 'desk-activity': deskActivity, 'desk-run': deskRun, system };
const STAFF = ['talkers', 'desk-kit', 'quick', 'present', 'host', 'sign', 'setup', 'desk', 'desk-runs', 'desk-facts', 'desk-activity', 'desk-run', 'system'];
function route() { return (location.hash || '').replace('#', '') || (SITE && SITE.page === 'tehaleh' ? 'tehaleh' : 'story'); }
function enter(r) {
  // arrival side effects happen once per navigation, never on re-render
  if (r.indexOf('qr-') === 0) {
    const id = r.slice(3).toUpperCase();
    const res = E.signResolve(id);
    if (res.kind !== 'unknown' && res.listing) E.emit(LID, 'qr.scanned', { sign: id });
    track('scan', { sign: id });
    session.attribution = 'qr'; keepSession();
    location.replace('#' + (res.kind === 'valuation' ? 'valuation' : res.kind === 'explore' ? 'story' : 'between'));
    return false;
  }
  if (r.indexOf('fw-') === 0) { session.follower = r.toUpperCase(); keepSession(); location.replace('#following'); return false; }
  if (r.indexOf('hb-') === 0) { try { E.homeBook(LID, 'HOME-' + r.slice(3).toUpperCase()); session.book = 'HOME-' + r.slice(3).toUpperCase(); keepSession(); } catch (e) {} location.replace('#home-book'); return false; }
  if (r.indexOf('t-') === 0) { const tk = E.talkers(LID).find(c => c.id.toLowerCase() === r.slice(2)); const lx = L(); lx.talkerScans = lx.talkerScans || []; if (tk) lx.talkerScans.push({ at: E.now(), id: tk.id }); session.attribution = 'talker'; keepSession(); dirty = true; scheduleSave(); location.replace('#story'); if (tk) setTimeout(() => { const el = document.getElementById(tk.section); if (el) el.scrollIntoView(); }, 120); return false; }
  const l = L(); const sh = l.sellers.find(s => r === s.share.toLowerCase() || r === 's-' + s.share.toLowerCase());
  if (sh) { session.attribution = 'seller-share'; keepSession(); location.replace('#story'); return false; }
  if (r === 'story') E.emit(LID, 'site.visit', { session: session.visitor, source: session.attribution || 'direct' });
  if ((r === 'story' || r === 'tehaleh') && !(session.tracked || {})[r]) { session.tracked = Object.assign({}, session.tracked, { [r]: 1 }); keepSession(); track('visit', { view: r }); }
  return true;
}
let entering = false;
function safeEnter(r) { entering = true; try { return enter(r); } finally { entering = false; } }
function render() {
  if (!E || entering) return;
  let r = route();
  if (!ROUTES[r]) { if (r !== lastRoute) { lastRoute = r; if (!safeEnter(r)) return; } r = 'story'; }
  const first = r !== lastRoute;
  if (first) { lastRoute = r; closeSheet(); if (!safeEnter(r)) return; }
  if (SITE && ['seller', 'reveal', 'report', 'following', 'closing-book', 'home-book', 'sign', 'host'].concat(STAFF).indexOf(r) >= 0) { location.replace('#' + (SITE.page === 'tehaleh' ? 'tehaleh' : 'story')); return; }
  if (STAFF.indexOf(r) >= 0 && !isStaff()) { $app.innerHTML = `<div class="private"><div class="phone pad" style="padding-top:90px"><h1 class="serif">For the listing team.</h1><p class="muted">This part of the Concierge is private to ${esc(T().name)}.</p><a class="btn" href="#story">See the home</a></div></div>`; return; }
  const y = window.scrollY;
  if (r !== 'story') ui.menu = false;
  $app.innerHTML = ROUTES[r]() + (['story', 'tehaleh', 'valuation', 'home-edit', 'between', 'seller', 'reveal', 'report', 'following', 'closing-book', 'home-book', 'present'].indexOf(r) >= 0 ? '' : navButton());
  if (!SITE) document.title = r.indexOf('desk') === 0 || r === 'system' ? 'The Desk · ' + street() : street() + ' · ' + (V('community') || '');
  if (first) window.scrollTo(0, 0); else window.scrollTo(0, y);
}
function navButton() { return `<button class="navbtn" data-act="nav">Views</button>`; }
window.addEventListener('hashchange', render);

/* ============================================================
   SHEETS
   ============================================================ */
function sheet(html) {
  closeSheet();
  const s = document.createElement('div'); s.className = 'sheet'; s.id = 'sheet'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true');
  s.innerHTML = `<div class="box"><button class="x" data-act="close" aria-label="Close">×</button>${html}</div>`;
  s.addEventListener('click', e => { if (e.target === s) closeSheet(); });
  document.body.appendChild(s);
  const f = s.querySelector('input,textarea,button:not(.x)'); if (f) f.focus();
}
function closeSheet() { const s = document.getElementById('sheet'); if (s) s.remove(); const b = document.getElementById('lb'); if (b) b.remove(); }
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSheet();
  const lb = document.getElementById('lb'); if (!lb) return;
  if (e.key === 'ArrowRight') zoom(lb.dataset.i * 1 + 1); if (e.key === 'ArrowLeft') zoom(lb.dataset.i * 1 - 1);
});
function zoom(i) {
  const n = LC.MEDIA.length; i = (i + n) % n; const m = LC.MEDIA[i];
  let lb = document.getElementById('lb');
  if (!lb) { lb = document.createElement('div'); lb.id = 'lb'; lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); document.body.appendChild(lb); }
  lb.dataset.i = i;
  lb.innerHTML = `<div class="bar"><span>${esc(m.room)} · ${i + 1} / ${n}</span><button data-act="close" aria-label="Close photo">×</button></div><img src="${m.file}" alt="${esc(m.alt)}"><div class="bar"><button data-act="lb-prev" aria-label="Previous photo">←</button><span class="small" style="text-align:center">${esc(m.alt)}</span><button data-act="lb-next" aria-label="Next photo">→</button></div>`;
}
function tourSheet() {
  sheet(`<div class="eyebrow">Private tour</div><h3>See ${esc(street())} in person.</h3><p class="muted small" style="margin-top:-6px">${esc(T().agent.name)} will confirm a time personally.</p>
  <form data-form="tour">${contactFields('t')}
  <fieldset class="choice"><legend>Are you working with an agent?</legend><label><input type="radio" name="agent" value="Yes" required> Yes</label><label><input type="radio" name="agent" value="No"> No</label></fieldset>
  <fieldset class="choice"><legend>How are you buying?</legend><label><input type="radio" name="financing" value="Cash" required> Cash</label><label><input type="radio" name="financing" value="Pre-approved"> Pre-approved</label><label><input type="radio" name="financing" value="Not yet"> Not yet</label></fieldset>
  <div class="field"><label for="tw">When works for you? (optional)</label><input id="tw" name="when" placeholder="Saturday morning"></div>${honeypot()}
  <button class="btn wide">Request a tour</button><p class="consent-note">By requesting, you’re asking ${esc(T().agent.name)} to contact you about this home.</p></form>`);
}
function askSheet(from) {
  ui.who = from;
  const items = ui.qa.filter(x => x.from === from);
  sheet(`<div class="eyebrow">${from === 'seller' ? 'Your Concierge' : 'Ask about this home'}</div><h3>${from === 'seller' ? 'What would you like to know?' : 'Ask anything about the home.'}</h3>
  <div class="qa" id="qa">${items.map(x => `<div class="q">${esc(x.q)}</div><div class="a">${esc(x.a)}${x.photo ? `<img src="${M(x.photo).thumb}" alt="${esc(M(x.photo).alt)}" data-act="zoom" data-id="${x.photo}" style="width:100%;height:150px;object-fit:cover;margin-top:12px;cursor:zoom-in">` : ''}<div class="src">${esc(x.src)}</div>${x.reply && !x.sent ? `<form data-form="q-reply" data-i="${ui.qa.indexOf(x)}" style="margin-top:14px">${contactFields('q' + ui.qa.indexOf(x))}${honeypot()}<button class="btn wide">Send my question to ${esc(T().agent.name.split(' ')[0])}</button></form>` : x.sent ? '<div class="small" style="margin-top:10px;color:var(--ok)">Sent. ' + esc(T().agent.name.split(' ')[0]) + ' will reply personally.</div>' : ''}</div>`).join('')}</div>
  <div class="chips" aria-label="Suggested questions">${(from === 'seller' ? ['How many people visited this week?', 'When is the next open house?', 'What have you done for us lately?'] : ['Is there a view of Mount Rainier?', 'Tell me about the deck', 'How many bedrooms?', 'Is there air conditioning?', 'Which school district?']).filter(q => !items.some(x => x.q === q)).map(q => `<button type="button" class="chip" data-act="ask-q" data-from="${from}" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
  <form data-form="ask" data-from="${from}"><div class="field"><label for="qq">Or ask your own</label><input id="qq" name="q" placeholder="Type your question" required></div><button class="btn wide">Ask</button></form>
  <p class="small muted" style="margin-top:12px">Answers come only from verified facts about the home. Anything needing judgment goes to ${esc(T().agent.name)}.</p>`);
}

/* ---------- Concierge answers: rules first, then Claude, always grounded ---------- */
const JUDGMENT = /(should|offer|negotiat|lower|reduc|hold|accept|counter|worth|advice|recommend|strategy|price drop|discount)/i;
const PHOTO_FOR = [[/(view|rainier|mountain)/i, 'rainier-view2'], [/(deck|fire|outdoor|patio)/i, 'deck-fire'], [/(yard|lot|greenbelt|fence)/i, 'greenbelt-yard'], [/(kitchen|island|pantry)/i, 'kitchen-island'], [/(primary|bath|tub|closet)/i, 'primary-bath2'], [/(great room|fireplace|living)/i, 'great-room'], [/(trail|park|clubhouse)/i, 'aerial-mountains']];
function sellerAnswer(text) {
  const l = L(), r = E.report(LID);
  if (/(visit|views|people|traffic|seen|saw)/i.test(text)) { const v = r.metrics.find(m => m.key === 'visits'), s = r.metrics.find(m => m.key === 'showings'); return v.value + ' visits to your home’s story and ' + s.value + ' showing requests in the last 7 days' + (r.demo ? ' (includes sample data loaded for the demonstration)' : '') + '. Zillow and Redfin don’t share reliable numbers, so we don’t guess at them.'; }
  if (/open house/i.test(text)) { const o = l.openHouses.find(o => o.status === 'scheduled') || l.openHouses.find(o => o.status === 'awaiting_seller'); return o ? 'Your next open house is ' + o.label + (o.status === 'awaiting_seller' ? ' — it’s waiting for your OK in your portal.' : '.') : 'No open house is on the calendar yet. Chris will suggest a date with you.'; }
  if (/(done|did you|lately|working on)/i.test(text)) { const a = l.audit.filter(x => x.kind === 'action').slice(0, 3).map(x => x.text.toLowerCase()); return a.length ? 'Most recently: ' + a.join('; ') + '.' : 'We’re preparing your launch — you’ll see each step here as it happens.'; }
  return null;
}
async function ask(from, text) {
  const pic = (PHOTO_FOR.find(([re]) => re.test(text)) || [])[1] || null;
  const push = (a, src, photo) => { ui.qa.push({ from, q: text, a, src, photo }); askSheet(from); };
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 3 && !E.answer(LID, text) && !JUDGMENT.test(text)) return push('Happy to help — tap one of the questions below, or ask in a few words, like “Is there a view of Mount Rainier?”', 'Your Concierge');
  if (from === 'seller') { const sa = sellerAnswer(text); if (sa) { E.emit(LID, 'question.asked', { from, text, answer: sa }); return push(sa, 'From your listing’s records'); } }
  if (JUDGMENT.test(text)) {
    E.emit(LID, 'question.asked', { from, text });
    if (from === 'buyer') ui.qa.push({ from, q: text, a: `That’s a question for ${T().agent.name} personally. Where should he reply?`, src: 'Goes to ' + T().agent.name, reply: true }), askSheet(from); else
    return push(`That’s a judgment call, so I’ve passed it to ${T().agent.name}. You’ll hear back personally.`, 'Escalated · not answered by AI'); return;
  }
  const ruled = E.answer(LID, text);
  if (ruled) { E.emit(LID, 'question.asked', { from, text, answer: ruled }); return push(ruled, 'From the verified fact record' + (pic ? ' · photographed' : ''), /removed|don’t claim/.test(ruled) ? null : pic); }
  if (caps.sample) {
    const l = L(), verified = l.facts.filter(f => f.status === 'verified').map(f => f.label + ': ' + E.formatValue(f) + (f.note ? ' (' + f.note + ')' : '')).join('\n');
    const removed = l.facts.filter(f => f.status === 'removed').map(f => f.label).join(', ');
    const report = E.report(LID).summary;
    try {
      const out = await caps.sample(`You are the private Listing Concierge for ${street()}, marketed by ${T().name}. Answer the ${from}'s question in one to three warm, precise sentences.
RULES: Use ONLY the verified facts${from === 'seller' ? ' and the activity summary' : ''} below. Never mention: ${removed}. Never give pricing, negotiation, legal or financial advice, and never describe neighbors, demographics or who should live here (fair housing). If the facts do not answer it, reply with exactly: ESCALATE
VERIFIED FACTS:\n${verified}\n${from === 'seller' ? 'ACTIVITY THIS WEEK: ' + report + '\n' : ''}QUESTION: ${text}`, { modelTier: 'quick', cache: false });
      const a = (out.text || '').trim();
      if (a && a !== 'ESCALATE' && a.indexOf('ESCALATE') < 0) { E.emit(LID, 'question.asked', { from, text, answer: a }); return push(a, 'Answered by your Concierge from verified facts', pic); }
    } catch (e) { if (e && e.code === 'not_granted') caps.sample = null; }
  }
  if (from === 'buyer') { ui.qa.push({ from, q: text, a: `I don’t have a verified answer to that — ${T().agent.name} does. Where should he reply?`, src: 'Goes to ' + T().agent.name, reply: true }); return askSheet(from); }
  E.emit(LID, 'question.asked', { from, text });
  push(`I don’t have a verified answer to that, so I’ve asked ${T().agent.name} to reply personally.`, 'Escalated');
}

/* ---------- branded share graphics: one set, sized per channel ---------- */
const FORMATS = { post: [1080, 1350, 'Instagram & Facebook post'], story: [1080, 1920, 'Instagram & Facebook story'], square: [1080, 1080, 'Square post'], link: [1200, 630, 'Link preview & text message'] };
function graphicsPlan() {
  const l = L(), oh = l.openHouses.find(o => o.status === 'scheduled');
  const list = [
    { id: 'listed', fmt: 'post', photo: 'front-dusk', eyebrow: 'Just listed · Tehaleh', title: ['A home that', 'feels different.'], focus: 0.55 },
    { id: 'great', fmt: 'story', photo: 'great-room', eyebrow: 'Inside', title: ['Two stories', 'of light.'], focus: 0.5 },
    { id: 'view', fmt: 'square', photo: 'rainier-view', eyebrow: 'Mornings with a view', title: ['Mount Rainier,', 'from upstairs.'], focus: 0.62, overlay: true },
    { id: 'deck', fmt: 'post', photo: 'deck-fire', eyebrow: 'Room to unwind', title: ['Evenings by', 'the fire.'], focus: 0.4 },
    { id: 'link', fmt: 'link', photo: 'kitchen-island', eyebrow: 'Tehaleh · Bonney Lake', title: ['A home that', 'feels different.'], focus: 0.5, overlay: true }
  ];
  if (oh) list.unshift({ id: 'oh', fmt: 'story', photo: 'front-dusk', eyebrow: 'Open house', title: [oh.label.split(' · ')[0], oh.label.split(' · ')[1] || ''], focus: 0.55 });
  return list;
}
function cover(g, im, x, y, w, h, fx) {
  const r = Math.max(w / im.naturalWidth, h / im.naturalHeight), sw = w / r, sh = h / r;
  const sx = Math.max(0, Math.min(im.naturalWidth - sw, (im.naturalWidth - sw) * (fx == null ? 0.5 : fx))), sy = (im.naturalHeight - sh) / 2;
  g.drawImage(im, sx, sy, sw, sh, x, y, w, h);
}
async function drawGraphic(spec) {
  const [W, H] = FORMATS[spec.fmt], t = T(), c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const im = new Image(); im.src = M(spec.photo).file; await im.decode();
  const serif = '"Playfair Display", Georgia, serif', sans = 'Inter, system-ui, sans-serif';
  const ink = '#16191B', ivory = '#F7F5F1', gold = '#D9C2A0', soft = '#CFC8BC';
  g.fillStyle = ink; g.fillRect(0, 0, W, H);
  const pad = Math.round(W * 0.074), brandH = spec.fmt === 'link' ? 0 : Math.round(H * 0.085);
  const presented = 'PRESENTED BY', b1 = t.name.toUpperCase(), b2 = t.affiliation;
  const brand = (y, x0, align) => {
    g.textAlign = align || 'left'; const x = align === 'center' ? W / 2 : x0;
    g.fillStyle = gold; g.font = `500 ${Math.round(W * 0.016)}px ${sans}`; g.fillText(presented.split('').join(String.fromCharCode(8202)), x, y);
    g.fillStyle = ivory; const fs = Math.round(W * 0.021);
    g.font = `400 ${fs}px ${serif}`; g.fillText(b1.split('').join(String.fromCharCode(8202)), x, y + fs * 1.7);
    g.font = `400 ${fs}px ${sans}`; g.fillText(b2, x, y + fs * 3.2); g.textAlign = 'left';
  };
  if (spec.overlay) {
    cover(g, im, 0, 0, W, H, spec.focus);
    const gr = g.createLinearGradient(spec.fmt === 'link' ? 0 : 0, spec.fmt === 'link' ? 0 : H * 0.35, spec.fmt === 'link' ? W * 0.75 : 0, spec.fmt === 'link' ? 0 : H);
    if (spec.fmt === 'link') { gr.addColorStop(0, 'rgba(22,25,27,.92)'); gr.addColorStop(0.55, 'rgba(22,25,27,.55)'); gr.addColorStop(1, 'rgba(22,25,27,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    else { gr.addColorStop(0, 'rgba(22,25,27,0)'); gr.addColorStop(1, 'rgba(22,25,27,.92)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  } else {
    const ph = Math.round(H * (spec.fmt === 'story' ? 0.6 : 0.64));
    cover(g, im, 0, 0, W, ph, spec.focus);
    const gr = g.createLinearGradient(0, ph - 160, 0, ph); gr.addColorStop(0, 'rgba(22,25,27,0)'); gr.addColorStop(1, ink); g.fillStyle = gr; g.fillRect(0, ph - 160, W, 160);
  }
  // headline block
  const isLink = spec.fmt === 'link';
  const hs = Math.round(W * (isLink ? 0.06 : spec.fmt === 'story' ? 0.098 : 0.078));
  const textBottom = isLink ? H - pad * 1.75 : H - brandH - pad * 1.2;
  const lines = spec.title.filter(Boolean);
  let y = textBottom - Math.round(hs * 0.55) - lines.length * hs * 1.06 - (isLink ? 0 : 10);
  g.fillStyle = gold; g.font = `500 ${Math.round(W * (isLink ? 0.018 : 0.02))}px ${sans}`; g.fillText(spec.eyebrow.toUpperCase().split('').join(String.fromCharCode(8202)), pad, y - hs * 0.45);
  g.fillStyle = ivory; g.font = `400 ${hs}px ${serif}`;
  lines.forEach((ln, i) => g.fillText(ln, pad, y + hs * (i + 0.8) * 1.06));
  g.fillStyle = soft; g.font = `400 ${Math.round(W * (isLink ? 0.019 : spec.fmt === 'story' ? 0.028 : 0.024))}px ${sans}`;
  const meta = street() + '  ·  ' + LC.money(V('price')) + (isLink ? '' : '  ·  ' + V('beds') + ' bd · ' + V('baths') + ' ba');
  g.fillText(meta, pad, textBottom);
  if (isLink) { const by = H - pad * 0.8, fs = Math.round(W * 0.0145); g.fillStyle = 'rgba(247,245,241,.22)'; g.fillRect(pad, by - fs * 2, W * 0.42, 1);
    g.fillStyle = gold; g.font = `500 ${fs}px ${sans}`; g.fillText('PRESENTED BY', pad, by); const w0 = g.measureText('PRESENTED BY  ').width;
    g.fillStyle = ivory; g.font = `400 ${fs}px ${serif}`; g.fillText(t.name.toUpperCase(), pad + w0, by); const w1 = g.measureText(t.name.toUpperCase() + '  ·  ').width;
    g.font = `400 ${fs}px ${sans}`; g.fillText(t.affiliation, pad + w0 + w1, by); }
  else { g.fillStyle = 'rgba(247,245,241,.18)'; g.fillRect(pad, H - brandH - pad * 0.55, W - pad * 2, 1); brand(H - brandH - pad * 0.55 + Math.round(W * 0.045), pad); }
  return c;
}
async function shareGraphics() {
  sheet(`<div class="eyebrow">Your share kit</div><h3>Preparing your graphics…</h3>`);
  try { await Promise.all(['400 80px "Playfair Display"', '500 24px Inter', '400 24px Inter'].map(f => document.fonts.load(f))); } catch (e) {}
  const plan = graphicsPlan(); ui.cards = [];
  for (const sp of plan) { try { const c = await drawGraphic(sp); const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.88)); ui.cards.push({ sp, url: URL.createObjectURL(blob), blob }); } catch (e) {} }
  if (!ui.cards.length) return sheet(`<h3>The graphics couldn’t be drawn here.</h3>`);
  const s = L().sellers[0], link = shareUrl(s.share.toLowerCase()), a = E.assets(LID);
  const cap = i => [a.social[0].text, a.social[2].text, a.social[2].text, a.social[1].text, a.social[0].text][i % 5] + ' ' + link;
  sheet(`<div class="eyebrow">Your share kit</div><h3>${ui.cards.length} graphics, each sized for where it goes.</h3>
  <p class="small muted" style="margin-top:-6px">Press and hold any image, then choose <b>Save to Photos</b> or <b>Share</b>. Each one is presented by ${esc(T().name)}.</p>
  <div class="kit">${ui.cards.map((c, i) => `<figure><img src="${c.url}" alt="${esc(c.sp.eyebrow)} graphic for ${esc(street())}" style="aspect-ratio:${FORMATS[c.sp.fmt][0]}/${FORMATS[c.sp.fmt][1]}">
    <figcaption><span>${esc(FORMATS[c.sp.fmt][2])}</span><span class="row"><button class="btn text small" data-act="kit-caption" data-i="${i}">Copy caption</button>${caps.downloads ? `<button class="btn text small" data-act="kit-save" data-i="${i}">Save file</button>` : ''}</span></figcaption></figure>`).join('')}</div>
  <p class="small muted">Captions include your private link, so visits are counted for you — never who they are.</p>`);
  ui.capFor = cap;
  E.emit(LID, 'share.created', { seller: s.id, channel: 'kit' });
}

/* ============================================================
   ACTIONS
   ============================================================ */
const A = {
  nav: () => sheet(`<div class="eyebrow">Prototype navigator</div><h3>Each audience, its own experience.</h3><div class="navlist">
    ${[['story', 'Buyer · Property Story', 'Public'], ['seller', 'Seller · Journey & portal', 'Code ' + L().sellers[0].code], ['reveal', 'Seller · Launch reveal', 'After verified go-live'], ['report', 'Seller · Weekly report', 'Private'], ['host', 'Open house host', 'Staff, phone'], ['sign', 'Reusable QR sign', 'Print'], ['desk', 'The Desk', 'Staff'], ['desk-runs', 'How it runs', 'Live'], ['setup', 'Setup', 'Rules & connections'], ['desk-run', 'Run the scenario', 'Simulate the world'], ['system', 'System & tests', 'Acceptance']].map(([h, n, d]) => `<a href="#${h}" data-act="close"><span>${n}</span><span>${d}</span></a>`).join('')}</div>`),
  close: () => closeSheet(),
  zoom: el => zoom(LC.MEDIA.findIndex(m => m.id === el.dataset.id)),
  'lb-next': () => zoom(document.getElementById('lb').dataset.i * 1 + 1),
  'lb-prev': () => zoom(document.getElementById('lb').dataset.i * 1 - 1),
  tour: () => tourSheet(),
  ask: el => askSheet(el.dataset.from || 'buyer'),
  'ask-q': el => ask(el.dataset.from, el.dataset.q),
  'share-public': () => copy(shareUrl('story')),
  'oh-register': () => sheet(`<div class="eyebrow">Open house</div><h3>${esc(L().openHouses.find(o => o.status === 'scheduled').label)}</h3><p class="muted">No registration needed — just come by. If you’d like a reminder:</p><form data-form="oh-remind">${contactFields('r')}${honeypot()}<button class="btn wide">Remind me</button><p class="consent-note">We’ll send one reminder about this open house.</p></form>`),
  'oh-signin': () => sheet(`<div class="eyebrow">Welcome</div><h3>Glad you’re here.</h3><p class="muted">Signing in is optional. Leave your details only if you’d like us to follow up.</p><form data-form="oh-qr"><div class="field"><label for="on">Name (optional)</label><input id="on" name="name"></div><div class="field"><label for="oc">Email or phone (optional)</label><input id="oc" name="contact"></div><button class="btn wide">Sign in</button><p class="consent-note">Leave a phone or email and we’ll follow up once after today. Leave it blank and we won’t.</p></form>`),
  'seller-out': () => { session.seller = null; keepSession(); location.hash = 'story'; },
  'seller-approve': el => { E.approve(LID, el.dataset.id, 'approve'); toast('Approved — your Concierge is preparing everything.'); },
  'seller-decline': el => { E.approve(LID, el.dataset.id, 'decline'); E.emit(LID, 'question.asked', { from: 'seller', text: 'Could we find another time for the open house?' }); toast('We’ll suggest another time.'); },
  tone: el => { L().sellers[0].tone = el.dataset.v; dirty = true; scheduleSave(); render(); },
  'copy-share': () => { const s = L().sellers[0]; E.emit(LID, 'share.created', { seller: s.id, channel: 'link' }); copy(shareUrl(s.share.toLowerCase())); },
  'share-note': () => { const s = L().sellers[0]; sheet(`<div class="eyebrow">Share with a personal note</div><h3>Say it your way.</h3><form data-form="share-note"><div class="field"><label for="sn">Your message</label><textarea id="sn" name="msg">We just listed our home in Tehaleh — take a look at its story. ${shareUrl(s.share.toLowerCase())}</textarea></div><button class="btn wide">Copy message</button></form><p class="small muted">Paste it into a text, email or post. Only visit counts come back to you — never who opened it.</p>`); },
  'story-card': () => shareGraphics(),
  'kit-caption': el => copy(ui.capFor(el.dataset.i * 1)),
  'kit-save': async el => { const c = ui.cards[el.dataset.i * 1]; try { await caps.downloads.save({ filename: '19917-' + c.sp.id + '-' + c.sp.fmt + '.jpg', data: c.blob }); } catch (e) { toast('Saving was declined.'); } },
  'copy-report': () => copy('Weekly report · ' + street() + '\n' + E.report(LID).summary + '\nZillow & Redfin: unavailable (not estimated).'),
  'oh-walkin': () => { const oh = L().openHouses.find(o => o.status === 'scheduled'); E.emit(LID, 'openhouse.checkin', { oh: oh.id }); },
  tag: el => { const v = el.dataset.v; ui.tags = ui.tags.indexOf(v) >= 0 ? ui.tags.filter(t => t !== v) : ui.tags.concat(v); el.setAttribute('aria-pressed', ui.tags.indexOf(v) >= 0); },
  'oh-end': () => { const oh = L().openHouses.find(o => o.status === 'scheduled'); E.emit(LID, 'openhouse.completed', { oh: oh.id }); toast('Handed off. Follow-ups and the seller’s recap are done.'); },
  'sign-toggle': () => { const s = DB.signs['R-014-A']; s.listing = s.listing ? null : LID; s.history.push({ at: Date.now(), listing: s.listing }); DB.signs['R-014-B'].listing = s.listing; dirty = true; scheduleSave(); render(); },
  edit: el => { ui.editing = el.dataset.v || null; render(); },
  'sqft-src': el => { ui.sqftSource = el.dataset.v; el.parentNode.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === el)); const lb = document.querySelector('label[for=sq]'); if (lb) lb.textContent = 'Square feet (' + ui.sqftSource + ')'; },
  resolve: el => { E.resolve(LID, el.dataset.id, 'Handled by ' + T().agent.name); },
  'authorize-live': () => { E.emit(LID, 'authorize', { what: 'mls_activation', by: T().agent.name }); L().exceptions.filter(x => x.open && x.type === 'authorization').forEach(x => { x.open = false; x.resolved = Date.now(); }); E.emit(LID, 'mls.status', { status: 'Active', verified: true }); toast('Launched. The seller has their reveal.'); },
  reconnect: el => { E.emit(LID, 'provider.restore', { provider: 'social' }); const r = E.retry(LID, el.dataset.id); toast(r.ok || r.deduped ? 'Reconnected. Resumed without repeating anything.' : 'Still failing — try again shortly.'); },
  approve: el => { E.approve(LID, el.dataset.id, 'approve'); toast('Approved.'); },
  decline: el => { E.approve(LID, el.dataset.id, 'decline'); },
  call: el => { E.approve(LID, el.dataset.id, 'approve', { text: T().agent.name.split(' ')[0] + ' will call you personally to talk this through.' }); toast('Seller told to expect your call.'); },
  draft: async el => {
    const a = L().approvals.find(x => x.id === el.dataset.id); const q = L().questions.find(q => 'reply:' + q.id === a.key);
    el.textContent = 'Drafting…';
    try {
      const out = await caps.sample(`Draft a short, warm reply from listing agent ${T().agent.name} to his seller's question. Do not commit to a strategy; lay out the considerations and offer to talk. 3–4 sentences, plain text.
QUESTION: ${q ? q.text : a.label}
THIS WEEK: ${E.report(LID).summary}`, { modelTier: 'default', cache: false });
      ui['draft-' + a.id] = (out.text || '').trim(); render();
    } catch (e) { el.textContent = 'Draft it for me'; toast('Drafting isn’t available right now.'); }
  },
  'copy-invite': () => { const l = L(); copy(`Your home’s private Concierge is ready. Open ${shareUrl('seller')} and enter code ${l.sellers[0].code}. — ${T().agent.name}`); },
  'place-lead': el => { const k = el.dataset.k, t = { alerts: ['First notice', 'Homes like this in Tehaleh, before the weekend rush.', 'Send me new Tehaleh listings'], updates: ['Clubhouse updates', 'Only when there’s real news on The Retreat.', 'Send me clubhouse updates'], 'community-tour': ['A guided tour', T().agent.name + ' will reach out to plan it.', 'Contact me to plan a tour'] }[k];
    sheet(`<div class="eyebrow">${t[0]}</div><h3>${t[1]}</h3><form data-form="place-lead" data-k="${k}">${contactFields('p')}${honeypot()}<button class="btn wide">Done</button><p class="consent-note">We’ll only send what you asked for. Unsubscribe any time.</p></form><p class="small muted">Unsubscribe anytime. We never share your details.</p>`); },
  'research-apply': el => { const x = L().exceptions.find(e => e.id === el.dataset.id); if (!x) return; E.setFact(LID, x.data.key, x.data.value, 'verified', x.data.source); E.resolve(LID, x.id, 'Applied research update'); toast('Updated everywhere — story, remarks, posts.'); },
  clock: el => { const v = el.dataset.v; let add = v === 'friday' ? 0 : Number(v);
    if (v === 'friday') { const d = new Date(E.now()); d.setHours(9, 1, 0, 0); let k = (5 - d.getDay() + 7) % 7; if (k === 0 && E.now() >= d.getTime()) k = 7; d.setDate(d.getDate() + k); add = d.getTime() - E.now(); }
    DB.clockOffset = (DB.clockOffset || 0) + add; const ran = E.tick(LID); dirty = true; scheduleSave(); render(); toast(ran.length ? ran.length + ' scheduled job' + (ran.length > 1 ? 's' : '') + ' ran — see How it runs.' : 'Nothing was due yet.'); },
  'clock-reset': () => { DB.clockOffset = 0; dirty = true; scheduleSave(); render(); },
  'sim-offer': () => { E.emit(LID, 'offer.received', {}); toast('Offer alert sent to you. It’s on The Desk.'); location.hash = 'desk'; },
  'lead-contacted': el => { E.emit(LID, 'lead.contacted', { lead: el.dataset.id }); toast('Marked as reached. Reminders stand down.'); },
  'lead-confirm': el => { const d = L().leads.find(x => x.id === el.dataset.id); sheet(`<div class="eyebrow">Confirm a showing</div><h3>${esc(d.name || 'Buyer')}</h3>${d.when ? `<p class="muted">They suggested: ${esc(d.when)}</p>` : ''}<form data-form="confirm-showing" data-id="${d.id}"><div class="field"><label for="sd">Date</label><input id="sd" type="date" name="date" required value="${new Date(E.now() + 864e5).toISOString().slice(0, 10)}"></div><div class="field"><label for="stm">Time</label><input id="stm" type="time" name="time" value="11:00" required></div><button class="btn wide">Confirm and tell them</button></form><p class="small muted">${d.consent ? 'They get a confirmation right away; feedback is requested two hours after.' : 'They didn’t agree to emails, so call to confirm — feedback is still requested afterwards.'}</p>`); },
  'fb-open': el => sheet(`<div class="eyebrow">Showing feedback</div><h3>How did it go?</h3><p class="small muted">In production this arrives from the showing service. Your seller hears the substance, never the buyer’s name.</p><form data-form="feedback" data-id="${el.dataset.id}"><div class="chips">${[['high', 'Strong interest'], ['medium', 'Some interest'], ['low', 'Not for them']].map(([v, n], i) => `<label class="chip" style="display:inline-flex;align-items:center;gap:8px"><input type="radio" name="interest" value="${v}" ${i === 0 ? 'checked' : ''}> ${n}</label>`).join('')}</div><div class="field"><label for="fn">What stood out</label><input id="fn" name="note" placeholder="Loved the deck; wondered about HOA dues"></div><button class="btn wide">Share with the seller</button></form>`),
  menu: () => { ui.menu = !ui.menu; render(); },
  'share-guide': async () => { const url = shareUrl('tehaleh'); try { if (navigator.share) { await navigator.share({ title: 'Life in Tehaleh', text: 'A guide to Tehaleh from ' + T().name, url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; } copy(url); },
  'menu-go': el => { ui.menu = false; location.hash = el.getAttribute('href').slice(1); },
  'tell-q': el => caps.sample ? tell(el.dataset.q) : tellOffline(el.dataset.q),
  'check-drive': () => checkDrive(),
  'check-metricool': () => checkMetricool(),
  gmail: el => { const st = settings(); st.gmail = el.dataset.v; if (st.gmail === 'drafts') st.gmailSince = Date.now(); dirty = true; scheduleSave(); render(); if (st.gmail === 'drafts' && !L().sellers[0].email) toast('Add your seller’s email in step 4.'); },
  suggest: () => aiSuggest(),
  'do-suggest': el => { const x = (ui.suggest || ruleSuggestions())[el.dataset.i * 1]; if (!x) return;
    if (x.action === 'lead-photo') { E.setLeadPhoto(LID, x.photo, x.title); ui.suggest = null; toast('The story now leads with that photo.'); }
    else if (x.action === 'open-house') location.hash = 'desk-run';
    else if (x.action === 'seller-note') writeSellerNote(); },
  verify: el => { const f = E.fact(L(), el.dataset.k); E.setFact(LID, f.key, f.value, 'verified', f.source.replace(' · needs verification', '') + ' · verified by ' + T().agent.name); toast('Verified — now used everywhere.'); },
  policy: el => { const r = E.setPolicy(el.dataset.k, el.dataset.v); if (!r.ok) toast('That guardrail is locked.'); },
  mode: el => { L().mode = el.dataset.v; dirty = true; scheduleSave(); render(); },
  'pick-cat': el => { ui.cat = el.dataset.v; el.parentNode.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === el)); },
  'run-tests': () => { testResults = LCTests.run(LC); render(); },
  'sim-mls': el => { const r = E.emit(LID, 'mls.status', { status: el.dataset.v, verified: true }); toast(r.rejected === 'unauthorized' ? 'Held for your authorization — see the Overview.' : r.rejected ? 'Rejected: ' + r.rejected : 'NWMLS: ' + el.dataset.v); },
  'sim-mls-unverified': () => { E.emit(LID, 'mls.status', { status: 'Active', verified: false }); toast('Ignored — not verified. Nothing launched.'); },
  'sim-week': () => {
    const now = Date.now(), srcs = ['social', 'social', 'email', 'direct', 'seller-share', 'seller-share', 'agents', 'qr'];
    for (let i = 0; i < 186; i++) { const at = now - Math.random() * 6.9 * 864e5; L().visits.push({ at, session: 'demo' + i + Math.random(), source: srcs[i % srcs.length], demo: true }); }
    for (let i = 0; i < 14; i++) L().scans.push({ at: now - Math.random() * 6 * 864e5, sign: 'R-014-A', cta: 'explore', demo: true });
    ['Sample buyer A', 'Sample buyer B', 'Sample buyer C'].forEach(n => E.emit(LID, 'lead.created', { kind: 'showing', name: n, contact: 'sample', source: 'social', cta: 'tour', consent: true, demo: true }));
    toast('Sample week loaded — labeled as sample in every report.');
  },
  'sim-tour': () => { location.hash = 'story'; setTimeout(tourSheet, 60); },
  'sim-question': () => { E.emit(LID, 'question.asked', { from: 'seller', text: 'Should we hold offers until after the second open house?' }); toast('Your seller’s question is on The Desk.'); location.hash = 'desk'; },
  'sim-report': () => { const r = E.emit(LID, 'weekly.tick'); toast(L().outbox.filter(m => m.kind === 'send.seller_report').length > 1 ? 'Sent.' : 'Sent once — run again and it won’t repeat.'); },
  'sim-outage': () => { E.emit(LID, 'provider.outage', { provider: 'social' }); toast('Social sign-in expired. The next posts will fail safely.'); },
  'sim-price': () => { E.emit(LID, 'price.change.requested', { to: 760000 }); toast('Waiting for you on The Desk.'); location.hash = 'desk'; },
  'sim-reset': () => { sheet(`<h3>Start over?</h3><p class="muted">The demonstration listing returns to “Marketing ready.” Activity, messages and requests are cleared.</p><button class="btn wide" data-act="reset-yes">Start over</button>`); },
  'reset-yes': () => { closeSheet(); const keepCode = L().sellers[0].code; boot(LC.seed()); L().sellers[0].code = keepCode; testResults = null; ui = Object.assign(ui, { qa: [], editing: null }); dirty = true; scheduleSave(); location.hash = 'desk'; render(); }
};
document.addEventListener('click', e => {
  const out = e.target.closest('[data-out]');
  if (out) { try { const l = L(); l.outbound = l.outbound || []; l.outbound.push({ at: E.now(), src: out.dataset.out }); dirty = true; scheduleSave(); } catch (err) {} return; }
  const sc = e.target.closest('[data-scroll]');
  if (sc) { e.preventDefault(); if (ui.menu) { ui.menu = false; render(); } const t = document.getElementById(sc.dataset.scroll); if (t) t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); return; }
  const el = e.target.closest('[data-act]'); if (!el || !A[el.dataset.act]) return;
  if (el.tagName === 'A' && el.dataset.act !== 'close') e.preventDefault();
  if (el.tagName === 'A' && el.dataset.act === 'close') { closeSheet(); return; }
  A[el.dataset.act](el, e);
});
const FORMS = {
  tour: async f => { const c = readContact(f); if (!c) return; const d = Object.assign(c, { agent: f.agent.value, financing: f.financing.value, when: f.when.value.trim() });
    const sent = await submitLead(f, 'tour', d); if (!sent) return;
    E.emit(LID, 'lead.created', { kind: 'showing', name: d.name, contact: d.phone + ' · ' + d.email, when: d.when, message: 'Agent: ' + d.agent + ' · Buying: ' + d.financing, source: session.attribution || 'direct', cta: 'request-tour', channel: 'web', consent: true });
    sheet(`<div class="eyebrow">Received</div><h3>Thank you, ${esc(d.name.split(' ')[0])}.</h3><p>${esc(T().agent.name)} has your request and will confirm a time with you personally.${SITE ? ' A confirmation is on its way to ' + esc(d.email) + '.' : ''}</p><button class="btn wide" data-act="close">Back to the home</button>`); },
  valuation: async f => { const c = readContact(f); if (!c) return; const d = Object.assign(c, { address: f.address.value.trim() });
    const sent = await submitLead(f, 'valuation', d); if (!sent) return;
    E.emit(LID, 'lead.created', { kind: 'valuation', name: d.name, contact: d.phone + ' · ' + d.email, message: d.address, source: session.attribution || 'direct', cta: 'valuation', channel: 'web', consent: true });
    $app.innerHTML = `<div class="private"><div class="phone pad" style="padding-top:90px;padding-bottom:90px"><div class="eyebrow">Received</div><h1 class="serif" style="font-size:36px">Thank you, ${esc(d.name.split(' ')[0])}.</h1><p>${esc(T().agent.name)} will prepare your valuation personally and be in touch.</p><a class="btn" href="#story">Back to the home</a></div></div>`; },
  vendor: async f => { if (!ui.cat) return toast('Choose what you’d like help with.'); const c = readContact(f); if (!c) return; if (!(await submitLead(f, 'home-edit', Object.assign(c, { category: ui.cat })))) return; const r = E.emit(LID, 'vendor.intro', { category: ui.cat, name: c.name, consent: true });
    toast(r.blocked ? 'We’ll need your permission to share your details.' : 'Introduction requested.'); if (!r.blocked) location.hash = 'story'; },
  'seller-login': f => { const r = E.sellerLogin(LID, f.code.value); if (r.ok) { session.seller = r.token; ui.loginError = false; keepSession();
    const live = PUBLIC.indexOf(L().state) >= 0 && L().updates.some(u => u.reveal);
    location.hash = live && f.dataset.next === 'seller' ? 'reveal' : f.dataset.next; render(); } else { ui.loginError = true; render(); } },
  ask: f => { const q = f.q.value.trim(); if (q) ask(f.dataset.from, q); },
  'share-note': f => { E.emit(LID, 'share.created', { seller: 'S1', channel: 'note' }); copy(f.msg.value); },
  'oh-guest': f => { const oh = L().openHouses.find(o => o.status === 'scheduled'); E.emit(LID, 'openhouse.checkin', { oh: oh.id, guest: { name: f.name.value, note: f.note.value, tags: ui.tags.slice(), consent: f.consent.checked } }); ui.tags = []; toast('Guest saved.'); render(); },
  'oh-qr': f => { const oh = L().openHouses.find(o => o.status === 'scheduled'); E.emit(LID, 'openhouse.checkin', { oh: oh.id, via: 'qr', guest: (f.contact.value.trim() ? { name: f.name.value, note: f.contact.value, tags: [], consent: true } : null) }); closeSheet(); toast('Welcome — enjoy the home.'); },
  'q-reply': async f => { const x = ui.qa[f.dataset.i * 1]; const c = readContact(f); if (!c || !x) return; if (!(await submitLead(f, 'question', Object.assign(c, { question: x.q })))) return; x.sent = true; E.emit(LID, 'lead.created', { kind: 'question', name: c.name, contact: c.phone + ' · ' + c.email, message: x.q, source: session.attribution || 'direct', cta: 'ask', channel: 'web', consent: true }); askSheet(x.from); },
  'oh-remind': async f => { const c = readContact(f); if (!c) return; if (!(await submitLead(f, 'open-house-reminder', c))) return; E.emit(LID, 'lead.created', { kind: 'event-reminder', name: c.name, contact: c.phone + ' · ' + c.email, source: session.attribution || 'direct', cta: 'open-house', channel: 'web', consent: true }); sheet(`<h3>You’re on the list.</h3><p>We’ll send one reminder before the open house.</p><button class="btn wide" data-act="close">Done</button>`); },
  sqft: f => { const n = parseInt(f.sqft.value, 10); if (!(n > 500 && n < 20000)) return toast('Enter a realistic figure.'); E.setFact(LID, 'sqft', n, 'verified', ui.sqftSource + ' · confirmed by ' + T().agent.name); ui.editing = null; toast('Confirmed — now on every page, email and post.'); },
  fact: f => { const k = f.dataset.k, cur = E.fact(L(), k); let v = f.value.value; if (typeof cur.value === 'number' || k === 'sqft' || k === 'price') v = v === '' ? null : Number(String(v).replace(/[^0-9.]/g, '')); ui.editing = null; E.setFact(LID, k, v, f.status.value, f.source.value); toast('Saved. Every asset rebuilt.'); },
  contract: f => { const t = k => new Date(f[k].value + 'T12:00:00').getTime(); E.emit(LID, 'contract.dates', { inspection: t('inspection'), appraisal: t('appraisal'), financing: t('financing'), closing: t('closing') }); toast('Timeline confirmed. Your seller sees it now; reminders are queued.'); },
  'confirm-showing': f => { const at = new Date(f.date.value + 'T' + f.time.value).getTime(); const label = new Date(at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); E.emit(LID, 'showing.confirmed', { lead: f.dataset.id, at, label }); closeSheet(); toast('Confirmed. Feedback will be requested automatically.'); },
  feedback: f => { E.emit(LID, 'showing.feedback', { showing: f.dataset.id, interest: f.interest.value, note: f.note.value }); closeSheet(); toast('Shared with your seller — without the buyer’s name.'); },
  'place-lead': async f => { const c = readContact(f); if (!c) return; if (!(await submitLead(f, f.dataset.k, c))) return; E.emit(LID, 'lead.created', { kind: f.dataset.k, name: c.name, contact: c.phone + ' · ' + c.email, source: 'tehaleh-guide', cta: f.dataset.k, channel: 'web', consent: true }); sheet(`<h3>You’re set, ${esc(c.name.split(' ')[0])}.</h3><p>${f.dataset.k === 'community-tour' ? esc(T().agent.name) + ' will be in touch to plan it.' : 'We’ll only write when there’s something worth sending.'}</p><button class="btn wide" data-act="close">Back to the guide</button>`); },
  tell: f => { const q = f.q.value.trim(); if (!q) return; caps.sample ? tell(q) : tellOffline(q); },
  brokerage: f => { E.setTenantSettings({ name: f.name.value, affiliation: f.affiliation.value, agentName: f.agentName.value, agentEmail: f.agentEmail.value }); toast('Saved — your name updates everywhere.'); },
  'seller-setup': f => { const s = L().sellers[0]; s.name = f.elements.name.value.trim() || 'Seller'; s.email = f.email.value.trim(); s.authorized.launch_comms = f.launch.checked; s.tone = f.tone.value; dirty = true; scheduleSave(); render(); toast('Seller saved.'); },
  'seller-note': f => { const r = E.emit(LID, 'seller.note', { text: f.text.value }); closeSheet(); toast(r.pending ? 'Waiting for your approval, per your rule.' : 'Sent to your seller.'); },
  intake: f => { const t = f.text.value.trim(); if (t) readNotes(t); },
  reply: f => { E.approve(LID, f.dataset.id, 'approve', { text: f.text.value }); toast('Reply sent to your seller.'); },
  'schedule-oh': f => { const d = new Date(f.date.value + 'T12:00:00'); const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + f.time.value;
    const r = E.emit(LID, 'openhouse.requested', { start: d.getTime(), label }); if (r.oh) r.oh.label = label; dirty = true; scheduleSave(); toast('Sent to your seller for approval.'); }
};
document.addEventListener('submit', e => { const f = e.target.closest('[data-form]'); if (!f || !FORMS[f.dataset.form]) return; e.preventDefault(); FORMS[f.dataset.form](f); });

/* ---------- start ---------- */
if (SITE) {
  boot(LC.seed());
  try { const l = L(); if (SITE.state && l.state !== SITE.state) { l.state = SITE.state; l.history.push({ at: SITE.listedAt || Date.now(), from: 'marketing_ready', to: 'active', why: 'Listed on NWMLS' }); }
    E.setFact(LID, 'amenities', 'Post & Pour café and the planned Retreat clubhouse (opening 2027)', 'verified', 'tehaleh.com');
    if (SITE.openHouse) l.openHouses.unshift({ id: 'OH-PUB', label: SITE.openHouse, status: 'scheduled', guests: 0, qr: 0, notes: [] });
    l.exceptions = []; } catch (e) {}
  dirty = false; save = async () => {}; scheduleSave = () => {};
} else boot(loadLocal());
render();
if (window.claude && claude.use) connect();
}
