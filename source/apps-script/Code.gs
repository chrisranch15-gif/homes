/**
 * RANCH LEADS \u2014 the email engine behind homes.ranchpnw.com
 * Same setup as the Adopt a Senior site: runs on Chris's Google account,
 * sends from his address, and logs every request to a Google Sheet.
 *
 * Deploy: Deploy \u2192 New deployment \u2192 Web app \u2192 Execute as: Me \u00b7 Who has access: Anyone.
 * First time: run setup() once from the editor to create the Sheet and send a test email.
 */
const AGENT_EMAIL = Session.getEffectiveUser().getEmail();   // the Google account that runs this script \u2014 yours
const AGENT_NAME = 'Chris Ranch';
const BRAND = 'The Ranch Real Estate Group';
const AFFILIATION = 'Keller Williams Puget Sound';
const SITE_URL = 'https://homes.ranchpnw.com';
const ALSO_NOTIFY = [];            // add teammates' emails here to copy them on every new lead
const SHEET_NAME = 'Ranch Leads \u00b7 homes.ranchpnw.com';

const TYPES = {
  'tour':                { label: 'Tour request',               needs: ['name', 'phone', 'email', 'agent', 'financing'] },
  'valuation':           { label: 'Home value request',         needs: ['name', 'phone', 'email', 'address'] },
  'follow':              { label: 'Following the home',         needs: ['name', 'phone', 'email'] },
  'question':            { label: 'Question about the home',    needs: ['name', 'phone', 'email', 'question'] },
  'alerts':              { label: 'Wants new Tehaleh listings', needs: ['name', 'phone', 'email'] },
  'updates':             { label: 'Wants Retreat clubhouse news', needs: ['name', 'phone', 'email'] },
  'community-tour':      { label: 'Tehaleh community tour',     needs: ['name', 'phone', 'email'] },
  'open-house-reminder': { label: 'Open house reminder',        needs: ['name', 'phone', 'email'] },
  'home-edit':           { label: 'Home Edit introduction',     needs: ['name', 'phone', 'email', 'category'] },
  'seller-message':      { label: 'Message from your sellers',  needs: ['name', 'question'] },
  'open-house':          { label: 'Open house sign-in',         needs: ['name', 'phone', 'email', 'agent'] },
  'off-market':          { label: 'Unlisted consult request',      needs: ['name', 'phone', 'email'] }
};
const OFFMARKET_HEADERS = ['Requested', 'Name', 'Phone', 'Email', 'Meeting', 'Best times', 'Wants', 'Areas', 'Came from', 'Home', 'Status'];
const LEAD_HEADERS = ['Received', 'Type', 'Name', 'Phone', 'Email', 'Details', 'Home', 'Page', 'Came from', 'Status'];
const ACTIVITY_HEADERS = ['When', 'What', 'Page', 'Came from', 'Visitor', 'Sign'];
const FOLLOWER_HEADERS = ['Since', 'Name', 'Phone', 'Email', 'Home', 'Unsubscribed'];
const SELLER_HEADERS = ['Code', 'Sellers', 'Home', 'Page', 'Listed', 'Status', 'Photo day'];
const UPDATE_HEADERS = ['When', 'Home', 'Title', 'Message', 'From'];
const MARKETING_HEADERS = ['When', 'Home', 'What', 'Reach', 'Notes'];
const SHOWING_HEADERS = ['When', 'Home', 'Interest', 'Feedback'];
const MARKET_HEADERS = ['Month', 'Home', 'Area', 'Median sold price', 'Homes sold', 'Active listings', 'Median days on market', 'Months of inventory', 'Sale-to-list %', 'Source'];
const PORTAL_HEADERS = ['When', 'Home', 'Site', 'Views', 'Saves', 'Notes'];
const OPENHOUSE_HEADERS = ['Id', 'Page', 'Date', 'Start', 'End', 'Status', 'Added'];
const SOCIAL_HEADERS = ['Checked', 'Home', 'Network', 'Posted', 'Post link', 'Image', 'Reach', 'Views', 'Interactions', 'Link clicks', 'Boost spend', 'Paid reach'];

/* ---------------- web endpoints ---------------- */


/** Run once: adds the hub's tabs (listings, deals, website checks, documents). Safe to run again. */
function setupHub() {
  const L = tab_('Listings', ['Address', 'City', 'Price', 'Status', 'Sellers', 'Page', 'Desk', 'Portal code', 'Listed', 'Photo']);
  if (L.getLastRow() < 2) {
    L.appendRow(['19917 145th St E', 'Bonney Lake (Tehaleh)', 775000, 'Active', 'Aaron and Holly', 'https://homes.ranchpnw.com/19917', 'https://claude.ai/artifact/E6iKnuAbJ77ML5sArMqhEq#desk', 'AH-QCRU9E', '2026-11-19', 'https://homes.ranchpnw.com/photos/front-dusk-800.webp']);
    L.appendRow(['11532 SE 173rd St #53', 'Renton', 275000, 'Active', '', '', '', '', '', '']);
  }
  const D = tab_('Deals', ['Updated', 'Address', 'Side', 'Status', 'Price', 'Commission %', 'GCI', 'Contract date', 'Closing date', 'Notes']);
  if (D.getLastRow() < 2) {
    D.appendRow([new Date(), '19917 145th St E', 'Listing', 'Active', 775000, '', '', '', '', 'Listed Nov 19']);
    D.appendRow([new Date(), '11532 SE 173rd St #53', 'Listing', 'Active', 275000, '', '', '', '', 'Price improved from $299,900']);
  }
  tab_('Checks', ['When', 'Site', 'URL', 'Result', 'Detail']);
  tab_('Market', MARKET_HEADERS);
  tab_('Documents', ['Saved', 'Address', 'File', 'From', 'Email date', 'Drive link']);
  return 'Hub tabs ready';
}

/** Run once: adds the seller-portal tabs and Aaron & Holly's access row. Safe to run again. */
function setupPortal() {
  tab_('Sellers', SELLER_HEADERS); tab_('Seller updates', UPDATE_HEADERS); tab_('Marketing', MARKETING_HEADERS); tab_('Showings', SHOWING_HEADERS);
  tab_('Portals', PORTAL_HEADERS); tab_('Social', SOCIAL_HEADERS);
  if (!seller_('AH-QCRU9E')) tab_('Sellers', SELLER_HEADERS).appendRow(['AH-QCRU9E', 'Aaron and Holly', '19917 145th St E', '19917', new Date('2026-11-19T16:00:00-08:00'), 'Active']);
  return 'Portal ready: ' + book_().getUrl();
}

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, reason: 'Bad request' }); }
  const type = String(d.type || '');
  if (type === 'office') return out_(officePost_(d));
  if (type === 'visit' || type === 'scan') {
    tab_('Activity', ACTIVITY_HEADERS).appendRow([new Date(), type === 'scan' ? 'Sign scan' : 'Visit \u00b7 ' + clean_(d.view, 20), clean_(d.page, 30), clean_(d.source, 40), clean_(d.visitor, 20), clean_(d.sign, 20)]);
    return out_({ ok: true });
  }
  if (type === 'check') {                                  // nightly website check from GitHub Actions
    const ok = /^https:\/\/(homes\.ranchpnw\.com|gotehaleh\.com|live\.ranchpnw\.com|script\.google\.com)\//;
    const rows = (Array.isArray(d.rows) ? d.rows : []).slice(0, 60).filter(r => Array.isArray(r) && ok.test(String(r[1])))
      .map(r => [Utilities.formatDate(new Date(), 'America/Los_Angeles', 'yyyy-MM-dd HH:mm'), clean_(r[0], 60), clean_(r[1], 200), /^ok$/i.test(r[2]) ? 'OK' : 'Problem', clean_(r[3], 200)]);
    if (rows.length) { const sh = tab_('Checks', ['When', 'Site', 'URL', 'Result', 'Detail']); sh.getRange(sh.getLastRow() + 1, 1, rows.length, 5).setValues(rows); }
    return out_({ ok: true, saved: rows.length });
  }
  if (d.website) return out_({ ok: true });               // hidden field: bots only
  if (type === 'seller-prep') return out_(sellerPrep_(d));
  if (type === 'seller-facts') return out_(sellerFacts_(d));
  if (type === 'open-house-notes' || type === 'open-house-feedback') {   // guest feedback: private to Chris; he decides what the sellers see
    const home = clean_(d.listing, 80), fb = clean_(d.feedback, 1200);
    if (!home || !fb) return out_({ ok: false, reason: 'Nothing to save' });
    const key = 'fb:' + clean_(d.email, 120).toLowerCase() + ':' + home, cache = CacheService.getScriptCache();
    const sh = tab_('Open house feedback', ['When', 'Home', 'Name', 'Email', 'Is this the one', 'Feedback', 'Shared with sellers']);
    const vals = [[new Date(), home, clean_(d.name, 80), clean_(d.email, 120), clean_(d.interest, 20), fb]];
    const row = Number(cache.get(key) || 0);                // the same guest changing answers updates one row
    if (row) sh.getRange(row, 1, 1, 6).setValues(vals);
    else { sh.appendRow(vals[0].concat(['No'])); cache.put(key, String(sh.getLastRow()), 21600); }
    return out_({ ok: true });
  }
  const t = TYPES[type];
  if (!t) return out_({ ok: false, reason: 'Unknown request' });
  const v = {
    name: clean_(d.name, 80), phone: clean_(d.phone, 30), email: clean_(d.email, 120).toLowerCase(),
    agent: clean_(d.agent, 80), financing: clean_(d.financing, 20), when: clean_(d.when, 120),
    address: clean_(d.address, 160), question: clean_(d.question, 600), category: clean_(d.category, 40),
    listing: clean_(d.listing, 80), page: clean_(d.page, 30), source: clean_(d.source, 40),
    wants: clean_(d.wants, 300), areas: clean_(d.areas, 200), meeting: clean_(d.meeting, 40), offmarket: !!d.offmarket, value: !!d.value
  };
  for (const k of t.needs) if (!v[k]) return out_({ ok: false, reason: 'Please fill in every field.' });
  if (type === 'seller-message') {
    const sel = seller_(d.code); if (!sel) return out_({ ok: false, reason: 'Please sign in again.' });
    tab_('Leads', LEAD_HEADERS).appendRow([new Date(), t.label, sel.names, '', '', v.question, sel.home, sel.page, 'seller portal', 'New']);
    try { GmailApp.sendEmail(AGENT_EMAIL, 'Message from ' + sel.names + ' \u00b7 ' + sel.home, v.question, { htmlBody: shell_('<p style="margin:0 0 6px;font:12px Arial;letter-spacing:.18em;color:#8C6A43;text-transform:uppercase">From your seller portal</p><h1 style="font:400 28px/1.2 Georgia,serif;margin:0 0 14px">' + esc_(sel.names) + '</h1><p style="font:16px/1.65 Arial">' + esc_(v.question) + '</p>'), name: 'Ranch Leads' }); } catch (err) { console.error(err); }
    return out_({ ok: true });
  }
  if (v.phone.replace(/\D/g, '').length < 10) return out_({ ok: false, reason: 'Please add a phone number with area code.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) return out_({ ok: false, reason: 'Please add a valid email.' });

  // a guest who already signed in and changes anything (details, Unlisted, value report): fix their row, don't add a new one
  if (type === 'open-house' && d.update) { const u = openHouseUpdate_(v, d); if (u) return out_(u); }

  // the same person pressing twice within two minutes counts once
  const cache = CacheService.getScriptCache(), key = 'dup:' + type + ':' + v.email;
  if (cache.get(key) && !d.update) return out_({ ok: true, duplicate: true });   // a guest correcting their details always goes through
  cache.put(key, '1', 120);

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return out_({ ok: false, reason: 'Busy for a moment \u2014 please try again.' });
  try {
    const details = details_(type, v);
    tab_('Leads', LEAD_HEADERS).appendRow([new Date(), t.label, v.name, v.phone, v.email, details, v.listing, v.page, v.source, 'New']);
    if (type === 'follow') tab_('Followers', FOLLOWER_HEADERS).appendRow([new Date(), v.name, v.phone, v.email, v.listing, '']);
    if (type === 'off-market') tab_('Unlisted buyers', OFFMARKET_HEADERS).appendRow([new Date(), v.name, v.phone, v.email, v.meeting || '\u2014', v.when || '\u2014', v.wants, v.areas, v.source, v.listing, 'Consult to schedule']);
    if (type === 'open-house' && v.value && v.address) tab_('Leads', LEAD_HEADERS).appendRow([new Date(), 'Home value request', v.name, v.phone, v.email, 'Home: ' + v.address + ' (from open house sign-in)', v.listing, v.page, v.source, 'New']);
  } finally { lock.releaseLock(); }

  try { notifyAgent_(type, t.label, v); } catch (err) { console.error('agent email', err); }
  try { if (type === 'open-house') queueConfirm_(type, v); else confirm_(type, v); } catch (err) { console.error('confirmation', err); }
  return out_({ ok: true });
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.api === 'ping') return out_({ ok: true, at: new Date().toISOString() });
  if (p.api === 'seller') return out_(sellerView_(p.code));
  if (p.api === 'openhouses') return out_(openHouses_(p.page));
  if (p.api === 'layout') return out_(photoLayout_(p.page));
  if (p.api === 'unsub' && p.e && p.t === token_(p.e)) {
    const sh = tab_('Followers', FOLLOWER_HEADERS), rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) if (String(rows[i][3]).toLowerCase() === String(p.e).toLowerCase() && !rows[i][5]) sh.getRange(i + 1, 6).setValue(new Date());
    return HtmlService.createHtmlOutput('<div style="font:17px/1.6 Georgia,serif;max-width:480px;margin:80px auto;padding:0 24px;color:#1E2327"><p style="letter-spacing:.2em;font:12px Arial;color:#8C6A43">' + BRAND.toUpperCase() + '</p><h1 style="font-weight:400">You\u2019re unsubscribed.</h1><p>You won\u2019t get any more updates about this home. Thank you for following it.</p></div>');
  }
  return out_({ ok: true });
}

/* ---------------- open houses (added from the Desk, shown on the listing page) ---------------- */
const LAYOUT_HEADERS = ['Saved', 'Page', 'Order', 'Hidden', 'Featured', 'By'];
function photoLayout_(page) { // the agent's photo order, hidden photos and featured grid for a listing page; last saved row wins
  page = String(page || '').trim(); const cache = CacheService.getScriptCache(), key = 'lay:' + page, hit = cache.get(key);
  if (hit) return JSON.parse(hit);
  const rows = tab_('Photo layout', LAYOUT_HEADERS).getDataRange().getDisplayValues().slice(1).filter(r => String(r[1]) === page);
  const r = rows[rows.length - 1], j = v => { try { return JSON.parse(v || '[]'); } catch (e) { return []; } };
  const res = r ? { ok: true, order: j(r[2]), hidden: j(r[3]), featured: j(r[4]), saved: r[0] } : { ok: true, order: [], hidden: [], featured: [] };
  cache.put(key, JSON.stringify(res), 60); return res;
}
function openHouses_(page) {
  page = String(page || '').trim(); const cache = CacheService.getScriptCache(), key = 'oh:' + page, hit = cache.get(key);
  if (hit) return JSON.parse(hit);
  const rows = tab_('Open houses', OPENHOUSE_HEADERS).getDataRange().getDisplayValues().slice(1).filter(r => r[0] && String(r[1]) === page);
  const res = { ok: true, rows: rows.map(r => ({ id: r[0], date: r[2], start: r[3], end: r[4], status: r[5] })) };
  cache.put(key, JSON.stringify(res), 60); return res;
}

/* ---------------- showings, read from ShowingTime emails ----------------
   Runs every 15 minutes (setupShowings installs the timer once).
   "Showing schedule" is seller-safe: time, status, type. No agent names.
   "Showing agents" is private to Chris and the Desk: buyer's agent contact. Never sent to sellers. */
const SCHEDULE_HEADERS = ['When', 'Home', 'Status', 'Type', 'Key', 'Updated'];
const SHOWING_AGENT_HEADERS = ['Key', 'Home', 'When', 'Agent', 'Brokerage', 'Phone', 'Email', 'Status', 'Type', 'Updated'];
function setupShowings() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'syncShowings').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncShowings').timeBased().everyMinutes(15).create();
  syncShowings();
}
function homeKey_(s) { const m = String(s || '').toLowerCase().replace(/street/g, 'st').replace(/[^a-z0-9 ]/g, ' ').match(/^\s*(\d+)\s+(\S+)(?:\s+(\S+))?/); return m ? m.slice(1).filter(Boolean).join(' ') : ''; }
function parseShowing_(subject, body) {
  const head = /^\s*(AGENT PREVIEW|SHOWING)\s+(REQUESTED|CONFIRMED|CANCELL?ED|DECLINED|RESCHEDULED)\s*\|\s*([^,]+),\s*([^,]+)?/i.exec(String(subject).replace(/\s+/g, ' '));
  if (!head) return null;
  const text = String(body).replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#0?39;|&#x27;|&rsquo;|\u2019/gi, "'");
  const L = text.split(/\n/).map(x => x.trim()).filter(Boolean);
  const di = L.findIndex(x => /^(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day, [A-Z][a-z]+ \d{1,2}, \d{4}$/.test(x));
  if (di < 0) return null;
  const tm = /^(\d{1,2}:\d{2} [AP]M)\s*-\s*(\d{1,2}:\d{2} [AP]M)$/.exec(L[di + 1] || '');
  const ds = L[di].replace(/^\w+, /, '') + ' ' + (tm ? tm[1] : '12:00 PM');
  const when = (typeof Utilities !== 'undefined') ? Utilities.parseDate(ds, 'America/Los_Angeles', 'MMMM d, yyyy h:mm a') : new Date(ds + ' PST');
  const ai = L.findIndex(x => /^Buyer'?s Agent Details$/i.test(x)), A = ai >= 0 ? L.slice(ai + 1, ai + 7) : [];
  const phone = A.find(x => /^\(?\d{3}\)?[ -]?\d{3}-\d{4}$/.test(x)) || '', email = A.find(x => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(x)) || '';
  let status = head[2].toUpperCase(); status = /CANCEL/.test(status) ? 'Cancelled' : status === 'CONFIRMED' ? 'Confirmed' : status === 'DECLINED' ? 'Declined' : status === 'RESCHEDULED' ? 'Rescheduled' : 'Requested';
  return { type: /PREVIEW/i.test(head[1]) ? 'Agent preview' : 'Showing', status, address: head[3].trim() + (head[4] ? ', ' + head[4].trim() : ''), home: homeKey_(head[3]), when,
    end: tm ? tm[2] : '', agent: A[0] && !/\d/.test(A[0]) ? A[0] : '', brokerage: A[1] && !/\d{3}/.test(A[1]) ? A[1] : '', phone, email };
}
function syncShowings() {
  const lock = LockService.getScriptLock(); if (!lock.tryLock(20000)) return;
  try {
    const rank = { Requested: 1, Rescheduled: 1, Confirmed: 2, Declined: 3, Cancelled: 3 };
    const sched = tab_('Showing schedule', SCHEDULE_HEADERS), agents = tab_('Showing agents', SHOWING_AGENT_HEADERS);
    const sv = sched.getDataRange().getValues(), av = agents.getDataRange().getValues();
    const seen = {}; sv.slice(1).forEach((r, i) => { seen[r[4]] = i + 2; });
    const threads = GmailApp.search('from:callcenter@showingtime.com newer_than:4d', 0, 100);
    const msgs = []; threads.forEach(t => t.getMessages().forEach(m => msgs.push(m)));
    msgs.sort((a, b) => a.getDate() - b.getDate());
    const stamp = Utilities.formatDate(new Date(), 'America/Los_Angeles', 'yyyy-MM-dd HH:mm');
    msgs.forEach(m => {
      const s = parseShowing_(m.getSubject(), m.getBody()); if (!s || isNaN(s.when)) return;
      const key = s.home + ' ' + Utilities.formatDate(s.when, 'America/Los_Angeles', 'yyyy-MM-dd HH:mm');
      const row = seen[key];
      if (row) {
        const cur = String(sched.getRange(row, 3).getValue());
        if ((rank[s.status] || 0) < (rank[cur] || 0) && s.status !== 'Rescheduled') return;
        sched.getRange(row, 3).setValue(s.status); sched.getRange(row, 6).setValue(stamp);
      } else {
        sched.appendRow([s.when, s.address, s.status, s.type, key, stamp]); seen[key] = sched.getLastRow();
      }
      const ar = av.findIndex(r => r[0] === key);
      const arow = [key, s.address, s.when, s.agent, s.brokerage, s.phone, s.email, s.status, s.type, stamp];
      if (ar > 0) agents.getRange(ar + 1, 1, 1, arow.length).setValues([arow]); else { agents.appendRow(arow); av.push(arow); }
    });
  } finally { lock.releaseLock(); }
  try { syncPhotos(); } catch (e) { console.log('syncPhotos: ' + e); }
}

/* ---------- Rainier Real Estate Photography (HD Photo Hub): orders and finished photos, from email ---------- */
const SHOOT_HEADERS = ['Key', 'Address', 'Status', 'Order', 'Package', 'Total', 'Ordered', 'Ready', 'Download page', 'Photos', 'Updated'];
const SHOOT_PHOTO_HEADERS = ['Key', 'Address', 'N', 'Title', 'Original'];
const RAINIER = 'https://view.rainierrephoto.com';
function parseDownloadPage_(html) { // owner-preview page (/h/<id>) embeds every file as JSON; photos are media type 1
  const out = [], re = /"nMediaTypeID":(\d+),"sMediaName":"([^"]*)","sOrigMediaKey":"([^"]+)"[^{}]*?"sExtension":"([a-z0-9]+)"/gi; let m;
  while ((m = re.exec(html))) if (m[1] === '1') out.push({ title: m[2], url: 'https://media.hd.pics/' + m[3] + '.' + m[4] });
  return out;
}
function syncPhotos() {
  const shoots = tab_('Photo shoots', SHOOT_HEADERS), pics = tab_('Shoot photos', SHOOT_PHOTO_HEADERS);
  const sv = shoots.getDataRange().getValues(), row = {}; sv.slice(1).forEach((r, i) => { row[r[0]] = i + 2; });
  const stamp = Utilities.formatDate(new Date(), 'America/Los_Angeles', 'yyyy-MM-dd HH:mm');
  const put = (key, vals) => { // vals: {col index: value}; creates the row if needed
    let r = row[key]; if (!r) { shoots.appendRow([key].concat(Array(SHOOT_HEADERS.length - 1).fill(''))); r = row[key] = shoots.getLastRow(); }
    Object.keys(vals).forEach(c => { if (vals[c] !== '' && vals[c] != null) shoots.getRange(r, Number(c) + 1).setValue(vals[c]); });
    shoots.getRange(r, 11).setValue(stamp); return r;
  };
  const msgs = []; GmailApp.search('from:rainierrephoto.com newer_than:45d', 0, 60).forEach(t => t.getMessages().forEach(m => msgs.push(m)));
  msgs.sort((a, b) => a.getDate() - b.getDate());
  msgs.forEach(m => {
    const subj = m.getSubject().replace(/\s+/g, ' '), body = m.getPlainBody(), when = Utilities.formatDate(m.getDate(), 'America/Los_Angeles', 'yyyy-MM-dd');
    const id = (/\/(?:m|d|h)\/([A-F0-9]{32})/i.exec(m.getBody()) || [])[1] || '';
    let o = /Order #\s*(\d+)/i.exec(subj);
    if (/thank you for your order/i.test(subj) && o) {
      const flat = body.replace(/\s+/g, ' ');
      const after = flat.slice(flat.indexOf('PROJECT DETAILS'));
      const am = /(\d+ [^,|]*?\b(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ct|Court|Pl|Place|Ln|Lane|Way|Blvd|Loop|Cir|Circle|Ter|Hwy|Pkwy)\b\.?(?: [NSEW]{1,2}\b)?(?:,? #\S+|,? (?:Unit|Apt) ?\S+)?),? ([A-Za-z .]+), WA (\d{5})/i.exec(after.replace(/^PROJECT DETAILS\s+[^@]*@\S+\s+/, ''));
      const addr = am ? am[1].trim() : '';
      console.log('order ' + o[1] + ' address: ' + (addr || 'NOT FOUND'));
      if (!addr) return;
      const pkg = ((/Packages\s+(.+?)\s+\$[\d,]+\.\d\d/.exec(flat) || [])[1] || '').replace(/\s*\*\s*/g, ' \u00b7 ').replace(/^\u00b7\s*/, '').trim();
      const total = (/(?<!SUB-)TOTAL\s*\|?\s*(\$[\d,]+\.\d\d)/.exec(flat) || [])[1] || '';
      const key = homeKey_(addr); const r = row[key];
      put(key, { 1: addr, 2: r && shoots.getRange(r, 3).getValue() === 'Ready' ? '' : 'Ordered', 3: o[1], 4: pkg.slice(0, 200), 5: total, 6: when, 8: id ? RAINIER + '/d/' + id : '' });
      return;
    }
    const ready = /^(.*?)\s+is ready!?$/i.exec(subj);
    if (ready && id) {
      const addr = ready[1].trim(), key = homeKey_(addr), r = put(key, { 1: addr, 2: 'Ready', 7: when, 8: RAINIER + '/d/' + id });
      if (String(shoots.getRange(r, 10).getValue()) !== '') return; // already listed, or Rainier asked for a browser
      try {
        const html = UrlFetchApp.fetch(RAINIER + '/h/' + id, { followRedirects: true, muteHttpExceptions: true }).getContentText();
        if (/Just a moment/i.test(html)) { shoots.getRange(r, 10).setValue('Open download page'); return; }
        const list = parseDownloadPage_(html); console.log('photos page ' + addr + ': ' + html.length + ' chars, ' + list.length + ' photos | ' + html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 400)); if (!list.length) return;
        pics.getRange(pics.getLastRow() + 1, 1, list.length, 5).setValues(list.map((p, i) => [key, addr, i + 1, p.title, p.url]));
        shoots.getRange(r, 10).setValue(list.length);
      } catch (e) { console.log('photos ' + addr + ': ' + e); }
    }
  });
}
function schedule_(home) {
  const k = homeKey_(home), now = Date.now();
  return tab_('Showing schedule', SCHEDULE_HEADERS).getDataRange().getValues().slice(1)
    .filter(r => homeKey_(r[1]) === k && r[0] instanceof Date)
    .map(r => ({ at: r[0].getTime(), status: String(r[2]), type: String(r[3]) }))
    .sort((a, b) => b.at - a.at).slice(0, 40);
}

/* ================= Concierge gateway =================
   Lean by design:
   1. Lookups answer from the Sheet with no AI at all.
   2. Otherwise the smallest model that fits: Haiku for short answers, Sonnet for drafting and actions.
   3. The rules and business context are sent first and unchanged, so the provider caches them
      (tools -> system -> messages; nothing that changes sits in the cached part).
   4. Every request is logged (agent, question, route, tokens, cache, cost) in "Concierge log".
   5. A daily cost ceiling per agent; past it, only lookups.
   The key lives in Script Properties (ANTHROPIC_API_KEY), pasted by Chris. Never in code or chat.
   Swap providers with the AI_PROVIDER property; each provider is one adapter function. */
const AI_MODELS = { quick: 'claude-haiku-5-5', standard: 'claude-sonnet-5-5' };
// USD per million tokens: input, output, cache read, cache write (5 min). Update here if prices change.
const AI_PRICES = { 'claude-haiku-5-5': [0.10, 0.50, 0.01, 0.125], 'claude-sonnet-5-5': [2, 10, 0.10, 2.5] };
const ASK_LOG_HEADERS = ['When', 'Agent', 'Question', 'Route', 'Model', 'Input tokens', 'Output tokens', 'Cache read', 'Cache write', 'Cost (cents)', 'Answer'];
const CONCIERGE_RULES = [
  'You are the Concierge for ' + AGENT_NAME + ', ' + BRAND + ' (' + AFFILIATION + '). You help the agent run their real estate business.',
  'Rules, always:',
  '- Nothing goes out without the agent. Emails, texts and posts are drafts the agent sends. You never contact a client.',
  '- When the agent asks to launch, list or set up a new listing, never say you cannot: propose launch_listing with whatever details they gave. The launch form opens for them to check, and missing details can be added later.',
  '- Sellers never see buyer\'s-agent names or details, and buyer\'s agents never see seller information.',
  '- Every fact comes from the data you are given or a tool. If you do not have it, say so in one line. Never guess prices, dates or features.',
  '- Client-facing drafts speak as the agent ("I"), warm, direct, specific and human. Never mention AI, a system or automation in them.',
  'How you talk (to the agent): like a sharp, friendly assistant who knows the business. Plain words, warm, never robotic or salesy.',
  '- Lead with the answer in the first sentence. Then only what helps: a reason, a number, a name.',
  '- Short paragraphs. A list only for 3 or more parallel items. No headings, no filler ("Great question", "I hope this helps").',
  '- If you need something, ask one clear question. If something is not possible, say so and offer the closest thing you can do.',
  '- End with the next step when there is one ("Want me to draft it?").',
  '- For a draft, call the propose tool with the finished text instead of pasting it in your answer.',
  '- If the same kind of question would be better as a saved answer, a button or a scheduled task, say so in one line at the end.'
].join('\n');

function ask_(d) {
  const q = clean_(d.q, 1500), agent = clean_(d.agent, 60) || AGENT_NAME;
  if (!q) return { ok: false, reason: 'Ask me something.' };
  const quick = quickAnswer_(q);                                  // 1. no AI
  if (quick) { askLog_(agent, q, 'lookup', '', {}, 0, quick); return { ok: true, route: 'lookup', text: quick }; }
  const props = PropertiesService.getScriptProperties();
  const cap = Number(props.getProperty('AI_DAILY_CAP_CENTS') || 100);
  const spent = askSpentToday_(agent);
  if (spent >= cap) {                                            // tell the agent plainly, and tell Chris once a day
    const c = CacheService.getScriptCache(), k = 'capmail:' + agent + ':' + Utilities.formatDate(new Date(), 'America/Los_Angeles', 'yyyyMMdd');
    if (!c.get(k)) { c.put(k, '1', 21600); try { GmailApp.sendEmail(AGENT_EMAIL, 'Concierge daily budget reached: ' + agent, agent + ' reached the Concierge daily budget ($' + (cap / 100).toFixed(2) + '). Written answers pause until midnight; lookups keep working. Change AI_DAILY_CAP_CENTS in Script Properties to adjust.', { name: 'Ranch Concierge' }); } catch (e) {} }
    return { ok: true, route: 'capped', spentCents: Math.round(spent * 100) / 100, capCents: cap,
      text: 'You have used today\'s Concierge budget ($' + (spent / 100).toFixed(2) + ' of $' + (cap / 100).toFixed(2) + '). Written answers and drafts pause until midnight. Quick lookups (codes, photo days, leads, sign-ins) still work.' };
  }
  const tier = /\b(draft|write|email|text|message|reply|post|caption|publish|plan|compare|summari[sz]e|explain why|rewrite|soften|letter|script|remarks|description)\b/i.test(q) || q.length > 280 ? 'standard' : 'quick';
  const provider = props.getProperty('AI_PROVIDER') || 'anthropic';
  const adapter = { anthropic: anthropicChat_ }[provider];
  if (!adapter) return { ok: false, reason: 'The Concierge provider "' + provider + '" is not set up.' };
  const history = (Array.isArray(d.history) ? d.history : []).slice(-6)
    .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: clean_(m.content, 2000) })).filter(m => m.content);
  try {
    const r = adapter(tier, history.concat([{ role: 'user', content: q }]), d);
    const model = AI_MODELS[tier], cents = askCost_(model, r.usage);
    askLog_(agent, q, tier === 'quick' ? 'quick' : 'standard', model, r.usage, cents, r.text);
    return { ok: true, route: tier, text: r.text, proposals: r.proposals || [], cents: Math.round(cents * 100) / 100 };
  } catch (err) {
    askLog_(agent, q, 'error', AI_MODELS[tier], {}, 0, String(err && err.message || err));
    return { ok: false, reason: /key/i.test(String(err)) ? 'The Concierge is not connected yet (no API key).' : 'The Concierge could not answer just now. Try again in a minute.' };
  }
}

// Answers that need no AI: read straight from the Sheet.
function quickAnswer_(q) {
  const t = q.toLowerCase();
  const sellers = tab_('Sellers', SELLER_HEADERS).getDataRange().getValues().slice(1).filter(r => r[0]);
  const which = sellers.filter(r => { const names = String(r[1]).toLowerCase().split(/ and | & |,\s*/); const num = String(r[2]).split(' ')[0];
    return names.some(n => n && t.indexOf(n.trim()) > -1) || (num && t.indexOf(num) > -1); });
  const one = which.length === 1 ? which[0] : null;
  if (one && /portal code|their code|login code/.test(t)) return one[1] + '\u2019s portal code is ' + one[0] + '.';
  if (one && /photo ?day|photo shoot|photos (on|when)|when are (the )?photos/.test(t))
    return one[6] ? one[1] + '\u2019s photo day is ' + Utilities.formatDate(new Date(one[6]), 'America/Los_Angeles', 'EEEE, MMM d') + '.' : 'No photo day is set for ' + one[1] + ' yet. Set it in The Office under their listing.';
  if (/how many (new )?leads|new leads (today|this week)|leads today/.test(t)) {
    const since = Date.now() - (/week/.test(t) ? 7 : 1) * 864e5;
    const rows = tab_('Leads', LEAD_HEADERS).getDataRange().getValues().slice(1).filter(r => new Date(r[0]).getTime() >= since && String(r[4]).toLowerCase() !== AGENT_EMAIL);
    return rows.length ? rows.length + ' new lead' + (rows.length === 1 ? '' : 's') + (/week/.test(t) ? ' this week' : ' in the last day') + ': ' + rows.slice(-5).map(r => r[2] + ' (' + r[1] + ')').join(', ') + '.' : 'No new leads ' + (/week/.test(t) ? 'this week' : 'in the last day') + '.';
  }
  if (/who signed in|sign.?ins/.test(t)) {
    const rows = tab_('Leads', LEAD_HEADERS).getDataRange().getValues().slice(1).filter(r => r[1] === 'Open house sign-in' && Date.now() - new Date(r[0]).getTime() < 3 * 864e5 && String(r[4]).toLowerCase() !== AGENT_EMAIL);
    return rows.length ? 'Open house sign-ins in the last 3 days: ' + rows.map(r => r[2] + ' (' + r[6] + ')').join(', ') + '.' : 'No open house sign-ins in the last 3 days.';
  }
  return '';
}

// Anthropic adapter. Order is tools -> system -> messages; the two system blocks never change between calls, so they cache.
function anthropicChat_(tier, messages, d) {
  const key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!key) throw new Error('No API key');
  const tools = conciergeTools_();
  const system = [
    { type: 'text', text: CONCIERGE_RULES },
    { type: 'text', text: conciergeContext_(), cache_control: { type: 'ephemeral' } }
  ];
  const usage = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
  let msgs = messages.slice(), proposals = [];
  for (let step = 0; step < 4; step++) {
    const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      payload: JSON.stringify({ model: AI_MODELS[tier], max_tokens: tier === 'quick' ? 600 : 1500, tools: tools, system: system, messages: msgs })
    });
    const j = JSON.parse(res.getContentText() || '{}');
    if (res.getResponseCode() !== 200) throw new Error((j.error && j.error.message) || ('HTTP ' + res.getResponseCode()));
    Object.keys(usage).forEach(k => usage[k] += (j.usage && j.usage[k]) || 0);
    const calls = (j.content || []).filter(b => b.type === 'tool_use');
    if (j.stop_reason !== 'tool_use' || !calls.length)
      return { text: (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim(), usage: usage, proposals: proposals };
    msgs.push({ role: 'assistant', content: j.content });
    msgs.push({ role: 'user', content: calls.map(c => { const out = runConciergeTool_(c.name, c.input || {}, proposals);
      return { type: 'tool_result', tool_use_id: c.id, content: JSON.stringify(out).slice(0, 12000) }; }) });
  }
  return { text: 'That took more steps than I allow for one question. Could you narrow it down?', usage: usage, proposals: proposals };
}

// The business context: stable for hours, so it caches. Changing data comes from tools instead.
function conciergeContext_() {
  const listings = tab_('Listings', ['Address']).getDataRange().getDisplayValues();
  const sellers = tab_('Sellers', SELLER_HEADERS).getDataRange().getDisplayValues().slice(1).map(r => [r[1], r[2], r[5], r[6] ? 'photo day ' + r[6] : ''].filter(Boolean).join(' | '));
  return 'Listings (address, city, price, status, sellers, page):\n' + listings.slice(1).filter(r => r[0]).map(r => [r[0], r[1], r[2], r[3], r[4], r[5]].filter(Boolean).join(' | ')).join('\n')
    + '\n\nSellers with portals:\n' + sellers.join('\n')
    + '\n\nSheet tabs you can read with read_tab: Leads, Listings, Sellers, Showings, Showing schedule, Open house feedback, Seller prep, Home facts, Unlisted buyers, Unlisted stories, Photo shoots, Seller updates.';
}

function conciergeTools_() {
  return [
    { name: 'read_tab', description: 'Read recent rows of one tab of the business Sheet. Use for leads, showings, feedback, checklists, Unlisted buyers and stories.',
      input_schema: { type: 'object', properties: { tab: { type: 'string' }, rows: { type: 'integer', description: 'How many of the newest rows (max 40)' } }, required: ['tab'] } },
    { name: 'propose', description: 'Propose an action for the agent to approve with one tap: a drafted email or text, a seller update, a checklist item, publishing feedback, or launching a new listing. For launch_listing put the address in listing and a JSON object in body with any of address, city, price, sellers, photos, notes that the agent gave (leave out what they did not say). Nothing happens until they approve.',
      input_schema: { type: 'object', properties: { kind: { type: 'string', enum: ['email_draft', 'text_draft', 'seller_update', 'checklist_item', 'publish_feedback', 'launch_listing', 'other'] },
        to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' }, listing: { type: 'string' } }, required: ['kind', 'body'] } }
  ];
}
const CONCIERGE_TABS = ['Leads', 'Listings', 'Sellers', 'Showings', 'Showing schedule', 'Open house feedback', 'Seller prep', 'Home facts', 'Unlisted buyers', 'Unlisted stories', 'Photo shoots', 'Seller updates'];
function runConciergeTool_(name, input, proposals) {
  if (name === 'read_tab') {
    const tabName = String(input.tab || ''), n = Math.min(40, Math.max(1, Number(input.rows) || 15));
    if (CONCIERGE_TABS.indexOf(tabName) < 0) return { error: 'Not a tab I can read. Choose one of: ' + CONCIERGE_TABS.join(', ') };
    const sh = book_().getSheetByName(tabName); if (!sh) return { rows: [] };
    const v = sh.getDataRange().getDisplayValues(); return { header: v[0], rows: v.slice(1).slice(-n) };
  }
  if (name === 'propose') { proposals.push({ kind: clean_(input.kind, 30), to: clean_(input.to, 200), subject: clean_(input.subject, 200), body: String(input.body || '').slice(0, 4000), listing: clean_(input.listing, 120) });
    return { ok: true, note: 'Shown to the agent for approval.' }; }
  return { error: 'Unknown tool' };
}

function askCost_(model, u) {
  const p = AI_PRICES[model]; if (!p || !u) return 0;
  return ((u.input_tokens || 0) * p[0] + (u.output_tokens || 0) * p[1] + (u.cache_read_input_tokens || 0) * p[2] + (u.cache_creation_input_tokens || 0) * p[3]) / 1e6 * 100;
}
function askLog_(agent, q, route, model, u, cents, answer) {
  try { tab_('Concierge log', ASK_LOG_HEADERS).appendRow([new Date(), agent, q, route, model, (u && u.input_tokens) || 0, (u && u.output_tokens) || 0,
    (u && u.cache_read_input_tokens) || 0, (u && u.cache_creation_input_tokens) || 0, Math.round(cents * 1000) / 1000, String(answer || '').slice(0, 300)]); } catch (err) { console.error(err); }
}
function askSpentToday_(agent) {
  const day = Utilities.formatDate(new Date(), 'America/Los_Angeles', 'yyyy-MM-dd');
  return tab_('Concierge log', ASK_LOG_HEADERS).getDataRange().getValues().slice(1)
    .filter(r => r[1] === agent && r[0] && Utilities.formatDate(new Date(r[0]), 'America/Los_Angeles', 'yyyy-MM-dd') === day)
    .reduce((a, r) => a + (Number(r[9]) || 0), 0);
}
// Questions that keep coming back: candidates for a saved answer, a button or a scheduled task.
function askReport_() {
  const rows = tab_('Concierge log', ASK_LOG_HEADERS).getDataRange().getValues().slice(1).filter(r => Date.now() - new Date(r[0]).getTime() < 30 * 864e5);
  const norm = q => String(q).toLowerCase().replace(/[0-9]+/g, '#').replace(/[^a-z# ]/g, ' ').split(/\s+/).filter(w => w.length > 3).sort().slice(0, 6).join(' ');
  const groups = {};
  rows.forEach(r => { const k = norm(r[2]); if (!k) return; (groups[k] = groups[k] || { example: r[2], count: 0, cents: 0, routes: {} }); groups[k].count++; groups[k].cents += Number(r[9]) || 0; groups[k].routes[r[3]] = 1; });
  const repeats = Object.keys(groups).map(k => groups[k]).filter(g => g.count >= 3).sort((a, b) => b.count - a.count).slice(0, 10)
    .map(g => ({ example: g.example, count: g.count, cents: Math.round(g.cents * 100) / 100, alreadyFree: !!g.routes.lookup && Object.keys(g.routes).length === 1 }));
  return { ok: true, month: { questions: rows.length, cents: Math.round(rows.reduce((a, r) => a + (Number(r[9]) || 0), 0) * 100) / 100,
    free: rows.filter(r => r[3] === 'lookup').length }, repeats: repeats };
}

/* ---------------- seller checklist and home facts ----------------
   The shared list lives in the site (content/prep.json); this tab keeps each seller's ticks,
   Chris's own items for that home (From = Chris) and items the sellers add (From = Seller). */
const PREP_HEADERS = ['Code', 'Home', 'Key', 'Item', 'From', 'Done', 'Updated'];
const FACT_FIELDS = [['updates', 'Updates and the year'], ['systems', 'Roof, furnace and water heater ages'], ['utilities', 'Utility providers and average monthly bills'],
  ['hoa', 'HOA name, dues and contact'], ['love', 'Favorite thing about the home that buyers will only discover living here'],
  ['life', 'A day here: mornings, evenings, weekends'], ['community', 'Neighborhood and community: what only locals know'], ['know', 'Anything a buyer should know']];
const FACT_HEADERS = ['Code', 'Home', 'Updated'].concat(FACT_FIELDS.map(f => f[1]));
function prepView_(code) {
  return tab_('Seller prep', PREP_HEADERS).getDataRange().getValues().slice(1)
    .filter(r => String(r[0]).toUpperCase() === code && String(r[4]) !== 'Removed')
    .map(r => ({ key: String(r[2]), text: String(r[3] || ''), from: String(r[4] || 'List'), done: r[5] === true || /^yes$/i.test(String(r[5])), at: r[6] ? new Date(r[6]).getTime() : null }));
}
// one row per seller + item; only the fields in patch change. onlyFrom: refuse unless the row came from that person
function prepSet_(code, home, key, patch, onlyFrom) {
  if (!/^[\w-]{1,40}$/.test(key)) return false;
  const lock = LockService.getScriptLock(); if (!lock.tryLock(10000)) return false;
  try {
    const sh = tab_('Seller prep', PREP_HEADERS), rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) if (String(rows[i][0]).toUpperCase() === code && String(rows[i][2]) === key) {
      if (onlyFrom && String(rows[i][4]) !== onlyFrom) return false;
      if ('item' in patch) sh.getRange(i + 1, 4).setValue(patch.item);
      if ('from' in patch) sh.getRange(i + 1, 5).setValue(patch.from);
      if ('done' in patch) sh.getRange(i + 1, 6).setValue(patch.done ? 'Yes' : '');
      sh.getRange(i + 1, 7).setValue(new Date()); return true;
    }
    if (onlyFrom) return false;
    sh.appendRow([code, home, key, patch.item || '', patch.from || 'List', patch.done ? 'Yes' : '', new Date()]); return true;
  } finally { lock.releaseLock(); }
}
function sellerPrep_(d) {
  const sel = seller_(d.code); if (!sel) return { ok: false, reason: 'Please sign in again.' };
  const key = clean_(d.key, 40);
  if (d.action === 'tick') { if (!prepSet_(sel.code, sel.home, key, { done: !!d.done })) return { ok: false, reason: 'Not saved' }; }
  else if (d.action === 'add') {
    const text = clean_(d.text, 160); if (!text) return { ok: false, reason: 'Type something to add.' };
    if (prepView_(sel.code).filter(x => x.from === 'Seller').length >= 40) return { ok: false, reason: 'Your list is full.' };
    prepSet_(sel.code, sel.home, 's-' + Date.now().toString(36), { item: text, from: 'Seller' });
  }
  else if (d.action === 'remove') { if (!prepSet_(sel.code, sel.home, key, { from: 'Removed' }, 'Seller')) return { ok: false, reason: 'Only your own items can be removed.' }; }
  else return { ok: false, reason: 'Bad request' };
  return { ok: true, prep: prepView_(sel.code) };
}
function factsView_(code) {
  const r = tab_('Home facts', FACT_HEADERS).getDataRange().getValues().slice(1).filter(x => String(x[0]).toUpperCase() === code)[0];
  if (!r) return null;
  const o = { at: r[2] ? new Date(r[2]).getTime() : null }; FACT_FIELDS.forEach((f, i) => o[f[0]] = String(r[3 + i] || '')); return o;
}
function sellerFacts_(d) {
  const sel = seller_(d.code); if (!sel) return { ok: false, reason: 'Please sign in again.' };
  const f = d.facts || {}, vals = FACT_FIELDS.map(x => clean_(String(f[x[0]] || '').replace(/\r?\n/g, ' / '), 1000));
  const lock = LockService.getScriptLock(); if (!lock.tryLock(10000)) return { ok: false, reason: 'Busy for a moment \u2014 please try again.' };
  try {
    const sh = tab_('Home facts', FACT_HEADERS), rows = sh.getDataRange().getValues(), row = [sel.code, sel.home, new Date()].concat(vals);
    let at = 0; for (let i = 1; i < rows.length; i++) if (String(rows[i][0]).toUpperCase() === sel.code) at = i + 1;
    if (at) sh.getRange(at, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
  } finally { lock.releaseLock(); }
  const cache = CacheService.getScriptCache();               // one email an hour at most, however often they save
  if (!cache.get('facts:' + sel.code)) {
    cache.put('facts:' + sel.code, '1', 3600);
    const body = FACT_FIELDS.map((x, i) => vals[i] ? '<tr><td style="padding:8px 12px 8px 0;font:13px Arial;color:#8C6A43;vertical-align:top;white-space:nowrap">' + esc_(x[1]) + '</td><td style="padding:8px 0;font:15px/1.5 Arial">' + esc_(vals[i]) + '</td></tr>' : '').join('');
    try { GmailApp.sendEmail(AGENT_EMAIL, 'Home facts from ' + sel.names + ' \u00b7 ' + sel.home, FACT_FIELDS.map((x, i) => x[1] + ': ' + (vals[i] || '\u2014')).join('\n'), { htmlBody: shell_('<p style="margin:0 0 6px;font:12px Arial;letter-spacing:.18em;color:#8C6A43;text-transform:uppercase">From your seller portal</p><h1 style="font:400 28px/1.2 Georgia,serif;margin:0 0 14px">' + esc_(sel.names) + ' filled in their home facts</h1><table style="border-collapse:collapse">' + body + '</table>'), name: 'Ranch Leads' }); } catch (err) { console.error(err); }
  }
  return { ok: true, facts: factsView_(sel.code) };
}

/* ---------------- seller portal ---------------- */
function seller_(code) {
  code = String(code || '').trim().toUpperCase(); if (code.length < 6) return null;
  const rows = tab_('Sellers', SELLER_HEADERS).getDataRange().getValues().slice(1);
  const r = rows.filter(x => String(x[0]).toUpperCase() === code)[0];
  return r ? { code: String(r[0]).toUpperCase(), names: r[1], home: r[2], page: String(r[3]), listed: r[4] ? new Date(r[4]).getTime() : null, status: r[5] || 'Active', photoDay: r[6] instanceof Date ? r[6].getTime() : (r[6] ? new Date(r[6]).getTime() || null : null) } : null;
}
function sellerView_(code) {
  const cache = CacheService.getScriptCache(), tries = Number(cache.get('sellerTries') || 0);
  if (tries > 60) return { ok: false, reason: 'Too many attempts. Try again in a few minutes.' };
  const sel = seller_(code);
  if (!sel) { cache.put('sellerTries', String(tries + 1), 600); return { ok: false, reason: 'That code didn\u2019t match.' }; }
  const now = Date.now(), week = 7 * 864e5;
  const act = tab_('Activity', ACTIVITY_HEADERS).getDataRange().getValues().slice(1).filter(r => String(r[2]) === sel.page);
  const visits = act.filter(r => /^Visit/.test(r[1])), seen = {}, seen7 = {};
  let shared = 0, scans = 0;
  visits.forEach(r => { const k = r[4] || Math.random(); seen[k] = 1; if (now - new Date(r[0]).getTime() < week) seen7[k] = 1; if (r[3] === 'seller-share') shared++; });
  act.forEach(r => { if (/^Sign scan/.test(r[1])) scans++; });
  const leads = tab_('Leads', LEAD_HEADERS).getDataRange().getValues().slice(1).filter(r => String(r[6]) === sel.home && r[8] !== 'test');
  const count = label => leads.filter(r => r[1] === label).length;
  const pick = (name, headers, map) => tab_(name, headers).getDataRange().getValues().slice(1).filter(r => String(r[1]) === sel.home).map(map).sort((a, b) => b.at - a.at).slice(0, 25);
  return { ok: true, sellers: sel.names, home: sel.home, page: sel.page, listed: sel.listed, status: sel.status,
    photoDay: sel.photoDay, prep: prepView_(sel.code), facts: factsView_(sel.code),
    metrics: { visitors: Object.keys(seen).length, visitors7: Object.keys(seen7).length, shared, scans, tours: count('Tour request'), following: count('Following the home'), questions: count('Question about the home') },
    updates: pick('Seller updates', UPDATE_HEADERS, r => ({ at: new Date(r[0]).getTime(), title: String(r[2]), text: String(r[3]), from: String(r[4]) })),
    marketing: pick('Marketing', MARKETING_HEADERS, r => ({ at: new Date(r[0]).getTime(), what: String(r[2]), reach: String(r[3]), notes: String(r[4]) })),
    schedule: schedule_(sel.home),
    showings: pick('Showings', SHOWING_HEADERS, r => ({ at: new Date(r[0]).getTime(), interest: String(r[2]), feedback: String(r[3]) })),
    portals: latest_(tab_('Portals', PORTAL_HEADERS).getDataRange().getValues().slice(1).filter(r => String(r[1]) === sel.home), 2, r => ({ at: new Date(r[0]).getTime(), site: String(r[2]), views: num_(r[3]), saves: num_(r[4]), notes: String(r[5] || '') })),
    market: tab_('Market', MARKET_HEADERS).getDataRange().getValues().slice(1).filter(r => String(r[1]) === sel.home || String(r[1]) === '*').map(r => ({ month: r[0] instanceof Date ? Utilities.formatDate(r[0], 'America/Los_Angeles', 'yyyy-MM') : String(r[0]).slice(0, 7), area: String(r[2]), median: num_(r[3]), sold: num_(r[4]), active: num_(r[5]), dom: num_(r[6]), moi: num_(r[7]), stl: num_(r[8]), source: String(r[9] || '') })).sort((a, b) => a.month < b.month ? -1 : 1),
    social: latest_(tab_('Social', SOCIAL_HEADERS).getDataRange().getValues().slice(1).filter(r => String(r[1]) === sel.home), 4, r => ({ at: new Date(r[0]).getTime(), network: String(r[2]), posted: r[3] ? new Date(r[3]).getTime() : null, url: String(r[4]), image: String(r[5] || ''), reach: num_(r[6]), views: num_(r[7]), interactions: num_(r[8]), clicks: num_(r[9]), spend: num_(r[10]), paidReach: num_(r[11]) })),
    at: now };
}

function num_(v) { const n = Number(String(v == null ? '' : v).replace(/[^\d.]/g, '')); return String(v) === '' || isNaN(n) ? null : n; }
// newest row per key column (a site, or a post link)
function latest_(rows, keyCol, map) {
  const out = {}; rows.forEach(r => { const k = String(r[keyCol]); if (!k) return; const t = new Date(r[0]).getTime(); if (!out[k] || t >= out[k].t) out[k] = { t, r }; });
  return Object.keys(out).map(k => map(out[k].r));
}

/* ---------------- emails ---------------- */
function notifyAgent_(type, label, v) {
  const first = v.name.split(' ')[0];
  const rows = [['Phone', '<a href="tel:' + v.phone.replace(/[^\d+]/g, '') + '">' + esc_(v.phone) + '</a> &nbsp;\u00b7&nbsp; <a href="sms:' + v.phone.replace(/[^\d+]/g, '') + '">Text</a>'],
    ['Email', '<a href="mailto:' + esc_(v.email) + '">' + esc_(v.email) + '</a>']];
  if (type === 'tour') rows.push(['Working with an agent', esc_(v.agent)], ['Buying', esc_(v.financing)]);
  if (type === 'open-house') { rows.push(['Working with an agent', esc_(v.agent)]); if (v.offmarket || /Updated/.test(label)) rows.push(['Unlisted', v.offmarket ? 'Interested in a consult' : 'Not interested now']); if (v.value) rows.push(['Value report', 'Yes' + (v.address ? '' : ' (no address yet)')]); }
  if (type === 'off-market') { rows.push(['Meet', esc_(v.meeting || 'In person')]); rows.push(['Likely fit', /Under \$750K/.test(v.wants) ? 'Inside Track (under $750K)' : /\$/.test(v.wants) ? 'By Invitation candidate ($750K+, owner outreach)' : 'Price not given yet']); if (v.wants) rows.push(['Looking for', esc_(v.wants)]); if (v.areas) rows.push(['Areas', esc_(v.areas)]); }
  if (v.when) rows.push(['Preferred time', esc_(v.when)]);
  if (v.address) rows.push(['Their home', esc_(v.address)]);
  if (v.question && type !== 'open-house' && type !== 'off-market') rows.push(['Question', esc_(v.question)]);
  if (v.category) rows.push(['Help with', esc_(v.category)]);
  rows.push(['Home', esc_(v.listing || '\u2014')], ['Came from', esc_(v.source || 'direct') + ' \u00b7 ' + esc_(v.page || '')]);
  const html = shell_('<p style="margin:0 0 6px;font:12px Arial;letter-spacing:.18em;color:#8C6A43;text-transform:uppercase">' + esc_(label) + '</p>' +
    '<h1 style="font:400 30px/1.15 Georgia,serif;margin:0 0 18px">' + esc_(v.name) + '</h1>' +
    '<table style="border-collapse:collapse;width:100%;font:15px/1.5 Arial">' + rows.map(r => '<tr><td style="padding:9px 12px 9px 0;color:#5E584E;vertical-align:top;white-space:nowrap">' + r[0] + '</td><td style="padding:9px 0;border-bottom:1px solid #EFEBE4">' + r[1] + '</td></tr>').join('') + '</table>' +
    '<p style="font:14px/1.6 Arial;color:#5E584E;margin:22px 0 0">Reply to this email to reach ' + esc_(first) + ' directly. It\u2019s also logged in your \u201c' + SHEET_NAME + '\u201d Google Sheet.</p>');
  const subject = label + ' \u2014 ' + v.name + (v.listing ? ' \u00b7 ' + v.listing : '');
  const opts = { htmlBody: html, replyTo: v.email, name: 'Ranch Leads' };
  if (ALSO_NOTIFY.length) opts.cc = ALSO_NOTIFY.join(',');
  GmailApp.sendEmail(AGENT_EMAIL, subject, label + ': ' + v.name + ' \u00b7 ' + v.phone + ' \u00b7 ' + v.email, opts);
}

function confirm_(type, v) {
  const first = v.name.split(' ')[0], home = v.listing || 'the home';
  const copy = {
    'tour': ['Your tour of ' + home, 'Thank you for asking to see ' + home + '. I\u2019ll confirm a time with you personally' + (v.when ? ' \u2014 you mentioned ' + v.when + '.' : '.') + ' If anything changes, just reply to this email.'],
    'valuation': ['Your home value request', 'Thank you for asking. I prepare every valuation personally \u2014 real recent sales, your home\u2019s upgrades and today\u2019s buyers, never an automated estimate. I\u2019ll be in touch shortly about ' + v.address + '.'],
    'follow': ['You\u2019re following ' + home, 'You\u2019ll hear from me the moment the price changes, an open house is set, or the status changes. Nothing else.'],
    'question': ['Your question about ' + home, 'Thanks for asking: \u201c' + v.question + '\u201d I\u2019ll reply personally, usually the same day.'],
    'alerts': ['New Tehaleh listings', 'You\u2019re on the list for new homes in Tehaleh \u2014 you\u2019ll hear before the weekend rush.'],
    'updates': ['The Retreat at Glacier Pointe', 'I\u2019ll write when there\u2019s real news on the clubhouse opening \u2014 and only then.'],
    'community-tour': ['Your Tehaleh tour', 'I\u2019d love to show you around \u2014 trails, parks and neighborhoods. I\u2019ll reach out to plan a time.'],
    'open-house-reminder': ['Open house reminder', 'You\u2019re set. I\u2019ll send one reminder before the open house.'],
    'open-house': ['Thanks for visiting ' + home, 'It was great having you at the open house today.' + (v.offmarket ? ' I\u2019ll also reach out about a consult for Unlisted, our off-market buyer program. Most agents wait for the right home to come on the market; we go hunting for it.' : '') + (v.value && v.address ? ' I\u2019ll prepare your updated value report for ' + v.address + ' personally.' : '') + ' If a question comes up about the home, just reply here.'],
    'off-market': ['Your Unlisted consult', 'Thank you for reaching out. Most agents wait for the right home to come on the market. We don\u2019t. We go hunting, investing our own time and funds, and every year we help clients secure their dream homes before anyone else knows they\u2019re available. It starts with an in-person consult (or video if that\u2019s easier) to get very clear on what you want, where, and how you\u2019re buying. I\u2019ll reach out personally to set a time.'],
    'home-edit': ['Your introduction', 'I\u2019ll introduce you to one trusted ' + v.category.toLowerCase() + ' professional. Referral relationships and any fees are always disclosed before you engage anyone.']
  }[type];
  const unsub = type === 'follow' ? '<p style="font:12px Arial;color:#8A8378;margin:18px 0 0"><a style="color:#8A8378" href="' + ScriptApp.getService().getUrl() + '?api=unsub&e=' + encodeURIComponent(v.email) + '&t=' + token_(v.email) + '">Stop following this home</a></p>' : '';
  const html = shell_('<h1 style="font:400 28px/1.2 Georgia,serif;margin:0 0 16px">Thank you, ' + esc_(first) + '.</h1><p style="font:16px/1.65 Arial;margin:0 0 16px">' + esc_(copy[1]) + '</p>' +
    '<p style="font:16px/1.65 Arial;margin:0">\u2014 ' + AGENT_NAME + '</p>' + unsub);
  GmailApp.sendEmail(v.email, copy[0], copy[1] + '\n\n\u2014 ' + AGENT_NAME + '\n' + BRAND + ' \u00b7 ' + AFFILIATION, { htmlBody: html, replyTo: AGENT_EMAIL, name: AGENT_NAME + ' \u00b7 ' + BRAND });
}

/* ---------------- open house sign-in: changes after signing in ----------------
   The guest's thank-you waits two minutes, so if they change their mind (say, untick Unlisted)
   the one email they get matches what they finally chose. A change after it went out gets one short note. */
function queueConfirm_(type, v) {
  const p = PropertiesService.getScriptProperties();
  p.setProperty('pend:' + v.email, JSON.stringify({ type: type, v: v, at: Date.now() }));
  try {
    if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'flushConfirms_')) ScriptApp.newTrigger('flushConfirms_').timeBased().after(2 * 60 * 1000).create();
  } catch (err) { console.error('timer', err); flushConfirms_(true); }   // no timer allowed: send now rather than never
}
function flushConfirms_(all) {
  const p = PropertiesService.getScriptProperties(), props = p.getProperties(), now = Date.now(); let left = 0;
  try { ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'flushConfirms_').forEach(t => ScriptApp.deleteTrigger(t)); } catch (e) {}
  Object.keys(props).filter(k => k.indexOf('pend:') === 0).forEach(k => {
    let x; try { x = JSON.parse(props[k]); } catch (e) { p.deleteProperty(k); return; }
    if (all !== true && now - x.at < 100000) { left++; return; }
    p.deleteProperty(k);
    try { confirm_(x.type, x.v); CacheService.getScriptCache().put('sent:' + x.v.email, JSON.stringify({ offmarket: !!x.v.offmarket, value: !!x.v.value }), 21600); } catch (err) { console.error('confirmation', err); }
  });
  if (left) try { ScriptApp.newTrigger('flushConfirms_').timeBased().after(60 * 1000).create(); } catch (e) { flushConfirms_(true); }
}
function openHouseUpdate_(v, d) {
  const prev = clean_(d.prevEmail, 120).toLowerCase() || v.email, emails = [prev, v.email], day = 864e5, now = Date.now();
  const lock = LockService.getScriptLock(); if (!lock.tryLock(15000)) return { ok: false, reason: 'Busy for a moment \u2014 please try again.' };
  let before = null;
  try {
    const sh = tab_('Leads', LEAD_HEADERS), rows = sh.getDataRange().getValues();
    const find = label => { for (let i = rows.length - 1; i > 0; i--) if (rows[i][1] === label && emails.indexOf(String(rows[i][4]).toLowerCase()) > -1 && String(rows[i][6]) === v.listing && now - new Date(rows[i][0]).getTime() < day) return i + 1; return 0; };
    const at = find('Open house sign-in'); if (!at) return null;              // nothing to fix: treat it as a new sign-in
    const old = String(rows[at - 1][5]);
    before = { offmarket: /Unlisted/.test(old), value: !!find('Home value request') && !/Withdrawn/.test(String(rows[find('Home value request') - 1][9])) };
    sh.getRange(at, 3, 1, 4).setValues([[v.name, v.phone, v.email, details_('open-house', v)]]);
    const va = find('Home value request');
    if (v.value && v.address) { if (va) sh.getRange(va, 3, 1, 4).setValues([[v.name, v.phone, v.email, 'Home: ' + v.address + ' (from open house sign-in)']]), sh.getRange(va, 10).setValue('New');
      else sh.appendRow([new Date(), 'Home value request', v.name, v.phone, v.email, 'Home: ' + v.address + ' (from open house sign-in)', v.listing, v.page, v.source, 'New']); }
    else if (va) sh.getRange(va, 10).setValue('Withdrawn');
  } finally { lock.releaseLock(); }
  const p = PropertiesService.getScriptProperties(), pend = p.getProperty('pend:' + prev);
  if (pend) {                                                          // thank-you not sent yet: it goes out with what they chose now
    p.deleteProperty('pend:' + prev); queueConfirm_('open-house', v);
  } else {
    const sent = JSON.parse(CacheService.getScriptCache().get('sent:' + prev) || 'null') || before;
    if (sent && (sent.offmarket !== !!v.offmarket || sent.value !== !!(v.value && v.address))) { try { changeNote_(v, sent); } catch (err) { console.error(err); } }
    CacheService.getScriptCache().put('sent:' + v.email, JSON.stringify({ offmarket: !!v.offmarket, value: !!(v.value && v.address) }), 21600);   // what their emails now say
  }
  try { notifyAgent_('open-house', 'Updated open house sign-in', v); } catch (err) { console.error(err); }
  return { ok: true, updated: true };
}
function changeNote_(v, was) {
  const first = v.name.split(' ')[0], lines = [];
  if (was.offmarket && !v.offmarket) lines.push('No problem \u2014 I won\u2019t reach out about Unlisted. If you ever want to talk about it, just reply.');
  if (!was.offmarket && v.offmarket) lines.push('I\u2019ll reach out about a consult for Unlisted, our off-market buyer program.');
  if (was.value && !(v.value && v.address)) lines.push('I\u2019ve taken you off the list for a home value report.');
  if (!was.value && v.value && v.address) lines.push('I\u2019ll put together an updated value report for ' + v.address + '.');
  if (!lines.length) return;
  const text = 'Thanks for updating your details. ' + lines.join(' ');
  GmailApp.sendEmail(v.email, 'Your details are updated', text + '\n\n\u2014 ' + AGENT_NAME + '\n' + BRAND + ' \u00b7 ' + AFFILIATION,
    { htmlBody: shell_('<h1 style="font:400 28px/1.2 Georgia,serif;margin:0 0 16px">Got it, ' + esc_(first) + '.</h1><p style="font:16px/1.65 Arial;margin:0 0 16px">' + esc_(text) + '</p><p style="font:16px/1.65 Arial;margin:0">\u2014 ' + AGENT_NAME + '</p>'), replyTo: AGENT_EMAIL, name: AGENT_NAME + ' \u00b7 ' + BRAND });
}

/* Run from the editor when something changes, e.g. notifyFollowers('New price', '19917 145th St E is now $760,000.') */
function notifyFollowers(title, message) {
  const rows = tab_('Followers', FOLLOWER_HEADERS).getDataRange().getValues().slice(1).filter(r => r[3] && !r[5]);
  const seen = {};
  rows.forEach(r => {
    const email = String(r[3]).toLowerCase(); if (seen[email]) return; seen[email] = 1;
    const link = ScriptApp.getService().getUrl() + '?api=unsub&e=' + encodeURIComponent(email) + '&t=' + token_(email);
    const html = shell_('<p style="margin:0 0 6px;font:12px Arial;letter-spacing:.18em;color:#8C6A43;text-transform:uppercase">' + esc_(r[4] || 'The home you follow') + '</p><h1 style="font:400 28px/1.2 Georgia,serif;margin:0 0 14px">' + esc_(title) + '</h1><p style="font:16px/1.65 Arial;margin:0 0 16px">' + esc_(message) + '</p><p style="font:16px/1.65 Arial;margin:0"><a href="' + SITE_URL + '/19917">See the home \u2192</a></p><p style="font:12px Arial;color:#8A8378;margin:18px 0 0"><a style="color:#8A8378" href="' + link + '">Stop following this home</a></p>');
    GmailApp.sendEmail(email, title + ' \u00b7 ' + (r[4] || ''), message + '\n\nStop following: ' + link, { htmlBody: html, replyTo: AGENT_EMAIL, name: AGENT_NAME + ' \u00b7 ' + BRAND });
  });
  return Object.keys(seen).length + ' followers told';
}

/* Run once from the editor: creates the Sheet, then sends you a test email. */
function setup() {
  tab_('Leads', LEAD_HEADERS); tab_('Followers', FOLLOWER_HEADERS); tab_('Activity', ACTIVITY_HEADERS);
  tab_('Sellers', SELLER_HEADERS); tab_('Seller updates', UPDATE_HEADERS); tab_('Marketing', MARKETING_HEADERS); tab_('Showings', SHOWING_HEADERS);
  notifyAgent_('tour', 'TEST \u2014 Tour request', { name: 'Test Buyer', phone: '(253) 555-0100', email: AGENT_EMAIL, agent: 'No', financing: 'Pre-approved', when: 'Saturday morning', listing: '19917 145th St E', page: 'setup', source: 'test' });
  return 'Sheet ready: ' + book_().getUrl();
}

/* ---------------- helpers ---------------- */
function details_(type, v) {
  if (type === 'tour') return 'Agent: ' + v.agent + ' \u00b7 Buying: ' + v.financing + (v.when ? ' \u00b7 When: ' + v.when : '');
  if (type === 'valuation') return 'Home: ' + v.address;
  if (type === 'question') return v.question;
  if (type === 'home-edit') return 'Help with: ' + v.category;
  if (type === 'open-house') return 'Agent: ' + v.agent + (v.offmarket ? ' \u00b7 Wants Unlisted consult' : '') + (v.value ? ' \u00b7 Value report' + (v.address ? ': ' + v.address : '') : '');
  if (type === 'off-market') return 'Unlisted consult \u00b7 ' + (v.meeting || 'In person') + (v.when ? ' \u00b7 ' + v.when : '') + ' \u00b7 Wants: ' + (v.wants || '\u2014') + ' \u00b7 Areas: ' + (v.areas || '\u2014');
  return '';
}
function book_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SHEET_ID'), ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) { ss = SpreadsheetApp.create(SHEET_NAME); props.setProperty('SHEET_ID', ss.getId()); }
  return ss;
}
function tab_(name, headers) {
  const ss = book_();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.getSheets().length === 1 && ss.getSheets()[0].getLastRow() === 0 && ss.getSheets()[0].getName() !== 'Leads' && name === 'Leads' ? ss.getSheets()[0].setName(name) : ss.insertSheet(name);
    sh.appendRow(headers); sh.setFrozenRows(1); sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sh;
}
function token_(email) {
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty('SECRET');
  if (!secret) { secret = Utilities.getUuid(); props.setProperty('SECRET', secret); }
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(String(email).toLowerCase(), secret)).slice(0, 16);
}
function shell_(inner) {
  return '<div style="background:#F7F5F1;padding:28px 12px"><div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #D9D2C6;padding:30px 28px;color:#1E2327">' + inner +
    '<div style="border-top:1px solid #EFEBE4;margin-top:26px;padding-top:14px;font:11px Arial;letter-spacing:.16em;color:#8C6A43">' + BRAND.toUpperCase() + ' &nbsp;|&nbsp; <span style="letter-spacing:0;color:#5E584E">' + AFFILIATION + '</span></div></div></div>';
}
function clean_(s, n) { return String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n); }
function esc_(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/* ---------- office.ranchpnw.com: the Hub outside Claude. Runs as Chris; every call needs his private office key. ---------- */
function setupOffice() { // run once from the editor; copy the key from the log into office.ranchpnw.com the first time you open it
  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty('OFFICE_KEY');
  if (!key) { key = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8); props.setProperty('OFFICE_KEY', key); }
  console.log('Your office password is in Project Settings \u2192 Script properties \u2192 OFFICE_KEY. Change it there to any password you like (10+ characters).');
  console.log(props.getProperty('ANTHROPIC_API_KEY') ? 'AI key: set' : 'AI key: not set yet. Project Settings, Script properties, add ANTHROPIC_API_KEY.');
  CalendarApp.getDefaultCalendar(); GmailApp.getAliases();
}
function officeOk_(k) { // Chris's office password (Script property OFFICE_KEY); 8 wrong tries locks the office for an hour
  const key = PropertiesService.getScriptProperties().getProperty('OFFICE_KEY'), cache = CacheService.getScriptCache();
  const fails = Number(cache.get('officeFails') || 0); if (fails >= 8 || !key) return false;
  const ok = typeof k === 'string' && k.length === key.length && k === key;
  if (!ok) cache.put('officeFails', String(fails + 1), 3600);
  return ok;
}
function threadOut_(t) {
  const ms = t.getMessages(), last = ms[ms.length - 1], first = ms[0], url = 'https://mail.google.com/mail/u/0/#all/' + t.getId();
  const mOut = m => ({ id: m.getId(), sender: m.getFrom(), subject: m.getSubject(), snippet: m.getPlainBody().replace(/\s+/g, ' ').slice(0, 400), date: m.getDate().toISOString(), viewUrl: url });
  return { id: t.getId(), viewUrl: url, messageCount: ms.length, messages: [mOut(last)], first: mOut(first) };
}
function calOut_(c, ev) {
  const me = Session.getEffectiveUser().getEmail(), guests = ev.getGuestList(true).map(g => ({ email: g.getEmail(), responseStatus: ({ YES: 'accepted', NO: 'declined', MAYBE: 'tentative', INVITED: 'needsAction', OWNER: 'accepted' })[String(g.getGuestStatus())] || 'needsAction', self: g.getEmail() === me }));
  const all = ev.isAllDayEvent(), st = all ? Utilities.formatDate(ev.getAllDayStartDate(), 'America/Los_Angeles', 'yyyy-MM-dd') : ev.getStartTime().toISOString();
  return { id: ev.getId(), summary: ev.getTitle(), start: all ? { date: st } : { dateTime: st }, location: ev.getLocation(), htmlLink: 'https://calendar.google.com/calendar/r/day/' + Utilities.formatDate(ev.getStartTime(), 'America/Los_Angeles', 'yyyy/M/d'),
    organizer: { email: ev.getCreators()[0] || '', self: ev.isOwnedByMe() }, attendees: guests, status: 'confirmed', myStatus: String(ev.getMyStatus()) };
}
// the Office sends HTML with the branded signature; its headshot arrives as inline attachment 0 (cid:att0)
function mailOpts_(a) {
  if (!a.htmlBody) return {};
  const o = { htmlBody: String(a.htmlBody) }, att = (a.attachments || [])[0];
  if (att && att.inline && att.content) o.inlineImages = { att0: Utilities.newBlob(Utilities.base64Decode(att.content), att.mimeType || 'image/jpeg', att.filename || 'photo.jpg') };
  return o;
}
function officeCall_(server, name, a) {
  a = a || {};
  if (server === 'Google Sheets') {
    const ss = book_();
    if (name === 'get_values') return { values: ss.getRange(a.range).getDisplayValues().filter(r => r.some(v => v !== '')) };
    if (name === 'append_values') { const sh = ss.getSheetByName(String(a.range).split('!')[0].replace(/'/g, '')); (a.values || []).forEach(r => sh.appendRow(r)); return { ok: true }; }
  }
  if (server === 'Gmail') {
    if (name === 'send_message') {                        // only ever called by the agent's own Send tap in the Office
      const to = (a.to || []).filter(x => /@/.test(x)).join(','); if (!to) throw new Error('No recipient');
      GmailApp.sendEmail(to, String(a.subject || ''), String(a.body || ''), mailOpts_(a));
      return { ok: true, viewUrl: 'https://mail.google.com/mail/u/0/#sent' };
    }
    if (name === 'search_threads') return { threads: GmailApp.search(String(a.query || 'in:inbox'), 0, Math.min(50, a.pageSize || 20)).map(threadOut_) };
    if (name === 'create_draft') {
      const body = String(a.body || ''); let d;
      if (a.replyToMessageId) d = GmailApp.getMessageById(a.replyToMessageId).createDraftReply(body, mailOpts_(a));
      else d = GmailApp.createDraft((a.to || []).join(','), String(a.subject || ''), body, mailOpts_(a));
      return { id: d.getId(), viewUrl: 'https://mail.google.com/mail/u/0/#drafts' };
    }
  }
  if (server === 'Google Calendar') {
    const cal = id => CalendarApp.getCalendarById(id) || CalendarApp.getDefaultCalendar();
    if (name === 'list_events') { const c = cal(a.calendarId); return { events: c.getEvents(new Date(a.startTime), new Date(a.endTime || Date.now() + 2 * 864e5)).slice(0, a.pageSize || 25).map(ev => calOut_(c, ev)) }; }
    if (name === 'create_event') { const ev = cal(a.calendarId).createEvent(String(a.summary || 'Event'), new Date(a.startTime), new Date(a.endTime), { location: a.location || '' }); return { id: ev.getId() }; }
    if (name === 'respond_to_event') { const ev = cal(a.calendarId).getEventById(a.eventId); ev.setMyStatus(a.responseStatus === 'accepted' ? CalendarApp.GuestStatus.YES : CalendarApp.GuestStatus.NO); return { ok: true }; }
  }
  throw new Error(server + ' isn\u2019t connected in the office yet.');
}
function officeAi_(prompt, opts) {
  const key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!key) throw new Error('AI key not set yet.');
  const r = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', { method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify({ model: (opts && opts.model) || 'claude-haiku-5-5', max_tokens: 4000, messages: [{ role: 'user', content: String(prompt) + '\n\nReply with JSON only.' }] }) });
  const j = JSON.parse(r.getContentText()); if (r.getResponseCode() !== 200) throw new Error((j.error && j.error.message) || 'AI error');
  const t = (j.content || []).map(c => c.text || '').join('').trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
  return JSON.parse(t);
}
function officePost_(d) {
  if (!officeOk_(d.key)) return { ok: false, reason: 'locked' };
  try {
    if (d.op === 'ping') return { ok: true, me: Session.getEffectiveUser().getEmail(), ai: !!PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY') };
    if (d.op === 'tool') return { ok: true, result: officeCall_(d.server, d.name, d.input) };
    if (d.op === 'listingStatus') {                       // remove (or restore) a listing: the row stays, only Status changes
      const sh = tab_('Listings', ['Address']), v = sh.getRange(1, 1, sh.getLastRow(), 1).getDisplayValues(), want = String(d.address || '').trim();
      let row = -1; v.forEach((r, i) => { if (i && String(r[0]).trim() === want) row = i + 1; });
      if (row < 2) return { ok: false, reason: 'Listing not found' };
      sh.getRange(row, 4).setValue(clean_(d.status, 20) || 'Removed'); return { ok: true, row: row };
    }
    if (d.op === 'ask') return ask_(d);                       // the Concierge: lookup first, cheapest model that fits, every call logged
    if (d.op === 'askReport') return askReport_();            // repeated questions worth turning into an answer, a button or a workflow
    if (d.op === 'ai') return { ok: true, result: officeAi_(d.prompt, d.opts) };
    if (d.op === 'story') {                                  // Unlisted hunt stories from past off-market deals
      const f = d.story || {}, c = k => clean_(f[k], 600);
      tab_('Unlisted stories', ['Added', 'Neighborhood', 'Year', 'Address (private)', 'They wanted', 'How we found it', 'Consult to keys', 'Why it never listed', 'Client quote', 'Can share', 'Photo', 'Level', 'Status'])
        .appendRow([new Date(), c('area'), c('year'), c('address'), c('wanted'), c('found'), c('timeline'), c('why'), c('quote'), c('share'), c('photo'), c('level'), 'Draft']);
      return { ok: true };
    }
    if (d.op === 'stories') {
      const rows = tab_('Unlisted stories', ['Added']).getDataRange().getValues().slice(1);
      return { ok: true, stories: rows.map(r => ({ at: new Date(r[0]).getTime(), area: String(r[1]), year: String(r[2]), level: String(r[11] || ''), status: String(r[12] || '') })).reverse() };
    }
    if (d.op === 'prep') {                                   // every seller's checklist progress, their own items and home facts
      const rows = tab_('Sellers', SELLER_HEADERS).getDataRange().getValues().slice(1).filter(r => r[0]);
      return { ok: true, sellers: rows.map(r => { const sel = seller_(r[0]); return { code: sel.code, names: sel.names, home: sel.home, status: sel.status, photoDay: sel.photoDay, prep: prepView_(sel.code), facts: factsView_(sel.code) }; }) };
    }
    if (d.op === 'prepItem') {                               // Chris's own items for one seller: add, edit, remove
      const sel = seller_(d.code); if (!sel) return { ok: false, reason: 'No seller with that code' };
      const text = clean_(d.text, 200);
      if (d.action === 'add') { if (!text) return { ok: false, reason: 'Empty item' }; prepSet_(sel.code, sel.home, 'c-' + Date.now().toString(36), { item: text, from: 'Chris' }); }
      else if (d.action === 'edit') { if (!text) return { ok: false, reason: 'Empty item' }; prepSet_(sel.code, sel.home, clean_(d.key, 40), { item: text }, 'Chris'); }
      else if (d.action === 'remove') prepSet_(sel.code, sel.home, clean_(d.key, 40), { from: 'Removed' }, 'Chris');
      return { ok: true, prep: prepView_(sel.code) };
    }
    if (d.op === 'photoDay') {                               // the date the countdown in the seller portal points at
      const sh = tab_('Sellers', SELLER_HEADERS), rows = sh.getDataRange().getValues(), code = String(d.code || '').toUpperCase();
      if (sh.getRange(1, 7).getValue() !== 'Photo day') sh.getRange(1, 7).setValue('Photo day').setFontWeight('bold');
      for (let i = 1; i < rows.length; i++) if (String(rows[i][0]).toUpperCase() === code) { sh.getRange(i + 1, 7).setValue(d.date ? new Date(d.date + 'T12:00:00') : ''); return { ok: true }; }
      return { ok: false, reason: 'No seller with that code' };
    }
    return { ok: false, reason: 'unknown' };
  } catch (err) { return { ok: false, reason: String(err && err.message || err).slice(0, 300) }; }
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
