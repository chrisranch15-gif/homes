/**
 * RANCH LEADS — the email engine behind homes.ranchpnw.com
 * Same setup as the Adopt a Senior site: runs on Chris's Google account,
 * sends from his address, and logs every request to a Google Sheet.
 *
 * Deploy: Deploy → New deployment → Web app → Execute as: Me · Who has access: Anyone.
 * First time: run setup() once from the editor to create the Sheet and send a test email.
 */
const AGENT_EMAIL = Session.getEffectiveUser().getEmail();   // the Google account that runs this script — yours
const AGENT_NAME = 'Chris Ranch';
const BRAND = 'The Ranch Real Estate Group';
const AFFILIATION = 'Keller Williams Puget Sound';
const SITE_URL = 'https://homes.ranchpnw.com';
const ALSO_NOTIFY = [];            // add teammates' emails here to copy them on every new lead
const SHEET_NAME = 'Ranch Leads · homes.ranchpnw.com';

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
  'off-market':          { label: 'Off-market buyer program',      needs: ['name', 'phone', 'email'] }
};
const OFFMARKET_HEADERS = ['Joined', 'Name', 'Phone', 'Email', 'Wants', 'Areas', 'Came from', 'Home'];
const LEAD_HEADERS = ['Received', 'Type', 'Name', 'Phone', 'Email', 'Details', 'Home', 'Page', 'Came from', 'Status'];
const ACTIVITY_HEADERS = ['When', 'What', 'Page', 'Came from', 'Visitor', 'Sign'];
const FOLLOWER_HEADERS = ['Since', 'Name', 'Phone', 'Email', 'Home', 'Unsubscribed'];
const SELLER_HEADERS = ['Code', 'Sellers', 'Home', 'Page', 'Listed', 'Status'];
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
    tab_('Activity', ACTIVITY_HEADERS).appendRow([new Date(), type === 'scan' ? 'Sign scan' : 'Visit · ' + clean_(d.view, 20), clean_(d.page, 30), clean_(d.source, 40), clean_(d.visitor, 20), clean_(d.sign, 20)]);
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
  if (type === 'open-house-feedback') {                     // anonymous room/verdict taps; shows in the seller portal's feedback
    const home = clean_(d.listing, 80), fb = clean_(d.feedback, 400);
    if (!home || !fb) return out_({ ok: false, reason: 'Nothing to save' });
    const key = 'fb:' + clean_(d.email, 120).toLowerCase() + ':' + home, cache = CacheService.getScriptCache(), sh = tab_('Showings', SHOWING_HEADERS);
    const row = Number(cache.get(key) || 0);                // the same guest changing answers updates one row
    if (row) sh.getRange(row, 1, 1, 4).setValues([[new Date(), home, 'Open house · ' + (clean_(d.interest, 20) || 'feedback'), fb]]);
    else { sh.appendRow([new Date(), home, 'Open house · ' + (clean_(d.interest, 20) || 'feedback'), fb]); cache.put(key, String(sh.getLastRow()), 21600); }
    return out_({ ok: true });
  }
  const t = TYPES[type];
  if (!t) return out_({ ok: false, reason: 'Unknown request' });
  const v = {
    name: clean_(d.name, 80), phone: clean_(d.phone, 30), email: clean_(d.email, 120).toLowerCase(),
    agent: clean_(d.agent, 80), financing: clean_(d.financing, 20), when: clean_(d.when, 120),
    address: clean_(d.address, 160), question: clean_(d.question, 600), category: clean_(d.category, 40),
    listing: clean_(d.listing, 80), page: clean_(d.page, 30), source: clean_(d.source, 40),
    wants: clean_(d.wants, 300), areas: clean_(d.areas, 200), offmarket: !!d.offmarket, value: !!d.value
  };
  for (const k of t.needs) if (!v[k]) return out_({ ok: false, reason: 'Please fill in every field.' });
  if (type === 'seller-message') {
    const sel = seller_(d.code); if (!sel) return out_({ ok: false, reason: 'Please sign in again.' });
    tab_('Leads', LEAD_HEADERS).appendRow([new Date(), t.label, sel.names, '', '', v.question, sel.home, sel.page, 'seller portal', 'New']);
    try { GmailApp.sendEmail(AGENT_EMAIL, 'Message from ' + sel.names + ' · ' + sel.home, v.question, { htmlBody: shell_('<p style="margin:0 0 6px;font:12px Arial;letter-spacing:.18em;color:#8C6A43;text-transform:uppercase">From your seller portal</p><h1 style="font:400 28px/1.2 Georgia,serif;margin:0 0 14px">' + esc_(sel.names) + '</h1><p style="font:16px/1.65 Arial">' + esc_(v.question) + '</p>'), name: 'Ranch Leads' }); } catch (err) { console.error(err); }
    return out_({ ok: true });
  }
  if (v.phone.replace(/\D/g, '').length < 10) return out_({ ok: false, reason: 'Please add a phone number with area code.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) return out_({ ok: false, reason: 'Please add a valid email.' });

  // the same person pressing twice within two minutes counts once
  const cache = CacheService.getScriptCache(), key = 'dup:' + type + ':' + v.email;
  if (cache.get(key) && !d.update) return out_({ ok: true, duplicate: true });   // a guest correcting their details always goes through
  cache.put(key, '1', 120);

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return out_({ ok: false, reason: 'Busy for a moment — please try again.' });
  try {
    const details = details_(type, v);
    tab_('Leads', LEAD_HEADERS).appendRow([new Date(), t.label, v.name, v.phone, v.email, details, v.listing, v.page, v.source, 'New']);
    if (type === 'follow') tab_('Followers', FOLLOWER_HEADERS).appendRow([new Date(), v.name, v.phone, v.email, v.listing, '']);
    if (type === 'off-market' || (type === 'open-house' && v.offmarket)) tab_('Off-market buyers', OFFMARKET_HEADERS).appendRow([new Date(), v.name, v.phone, v.email, v.wants, v.areas, v.source, v.listing]);
    if (type === 'open-house' && v.value && v.address) tab_('Leads', LEAD_HEADERS).appendRow([new Date(), 'Home value request', v.name, v.phone, v.email, 'Home: ' + v.address + ' (from open house sign-in)', v.listing, v.page, v.source, 'New']);
  } finally { lock.releaseLock(); }

  try { notifyAgent_(type, t.label, v); } catch (err) { console.error('agent email', err); }
  try { confirm_(type, v); } catch (err) { console.error('confirmation', err); }
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
    return HtmlService.createHtmlOutput('<div style="font:17px/1.6 Georgia,serif;max-width:480px;margin:80px auto;padding:0 24px;color:#1E2327"><p style="letter-spacing:.2em;font:12px Arial;color:#8C6A43">' + BRAND.toUpperCase() + '</p><h1 style="font-weight:400">You’re unsubscribed.</h1><p>You won’t get any more updates about this home. Thank you for following it.</p></div>');
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
      const pkg = ((/Packages\s+(.+?)\s+\$[\d,]+\.\d\d/.exec(flat) || [])[1] || '').replace(/\s*\*\s*/g, ' · ').replace(/^·\s*/, '').trim();
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

/* ---------------- seller portal ---------------- */
function seller_(code) {
  code = String(code || '').trim().toUpperCase(); if (code.length < 6) return null;
  const rows = tab_('Sellers', SELLER_HEADERS).getDataRange().getValues().slice(1);
  const r = rows.filter(x => String(x[0]).toUpperCase() === code)[0];
  return r ? { code: r[0], names: r[1], home: r[2], page: String(r[3]), listed: r[4] ? new Date(r[4]).getTime() : null, status: r[5] || 'Active' } : null;
}
function sellerView_(code) {
  const cache = CacheService.getScriptCache(), tries = Number(cache.get('sellerTries') || 0);
  if (tries > 60) return { ok: false, reason: 'Too many attempts. Try again in a few minutes.' };
  const sel = seller_(code);
  if (!sel) { cache.put('sellerTries', String(tries + 1), 600); return { ok: false, reason: 'That code didn’t match.' }; }
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
  const rows = [['Phone', '<a href="tel:' + v.phone.replace(/[^\d+]/g, '') + '">' + esc_(v.phone) + '</a> &nbsp;·&nbsp; <a href="sms:' + v.phone.replace(/[^\d+]/g, '') + '">Text</a>'],
    ['Email', '<a href="mailto:' + esc_(v.email) + '">' + esc_(v.email) + '</a>']];
  if (type === 'tour') rows.push(['Working with an agent', esc_(v.agent)], ['Buying', esc_(v.financing)]);
  if (type === 'open-house') { rows.push(['Working with an agent', esc_(v.agent)]); if (v.offmarket) rows.push(['Off-market buyer program', 'Yes, wants us searching']); if (v.value) rows.push(['Value report', 'Yes' + (v.address ? '' : ' (no address yet)')]); }
  if (type === 'off-market') { if (v.wants) rows.push(['Looking for', esc_(v.wants)]); if (v.areas) rows.push(['Areas', esc_(v.areas)]); }
  if (v.when) rows.push(['Preferred time', esc_(v.when)]);
  if (v.address) rows.push(['Their home', esc_(v.address)]);
  if (v.question && type !== 'open-house' && type !== 'off-market') rows.push(['Question', esc_(v.question)]);
  if (v.category) rows.push(['Help with', esc_(v.category)]);
  rows.push(['Home', esc_(v.listing || '—')], ['Came from', esc_(v.source || 'direct') + ' · ' + esc_(v.page || '')]);
  const html = shell_('<p style="margin:0 0 6px;font:12px Arial;letter-spacing:.18em;color:#8C6A43;text-transform:uppercase">' + esc_(label) + '</p>' +
    '<h1 style="font:400 30px/1.15 Georgia,serif;margin:0 0 18px">' + esc_(v.name) + '</h1>' +
    '<table style="border-collapse:collapse;width:100%;font:15px/1.5 Arial">' + rows.map(r => '<tr><td style="padding:9px 12px 9px 0;color:#5E584E;vertical-align:top;white-space:nowrap">' + r[0] + '</td><td style="padding:9px 0;border-bottom:1px solid #EFEBE4">' + r[1] + '</td></tr>').join('') + '</table>' +
    '<p style="font:14px/1.6 Arial;color:#5E584E;margin:22px 0 0">Reply to this email to reach ' + esc_(first) + ' directly. It’s also logged in your “' + SHEET_NAME + '” Google Sheet.</p>');
  const subject = label + ' — ' + v.name + (v.listing ? ' · ' + v.listing : '');
  const opts = { htmlBody: html, replyTo: v.email, name: 'Ranch Leads' };
  if (ALSO_NOTIFY.length) opts.cc = ALSO_NOTIFY.join(',');
  GmailApp.sendEmail(AGENT_EMAIL, subject, label + ': ' + v.name + ' · ' + v.phone + ' · ' + v.email, opts);
}

function confirm_(type, v) {
  const first = v.name.split(' ')[0], home = v.listing || 'the home';
  const copy = {
    'tour': ['Your tour of ' + home, 'Thank you for asking to see ' + home + '. I’ll confirm a time with you personally' + (v.when ? ' — you mentioned ' + v.when + '.' : '.') + ' If anything changes, just reply to this email.'],
    'valuation': ['Your home value request', 'Thank you for asking. I prepare every valuation personally — real recent sales, your home’s upgrades and today’s buyers, never an automated estimate. I’ll be in touch shortly about ' + v.address + '.'],
    'follow': ['You’re following ' + home, 'You’ll hear from me the moment the price changes, an open house is set, or the status changes. Nothing else.'],
    'question': ['Your question about ' + home, 'Thanks for asking: “' + v.question + '” I’ll reply personally, usually the same day.'],
    'alerts': ['New Tehaleh listings', 'You’re on the list for new homes in Tehaleh — you’ll hear before the weekend rush.'],
    'updates': ['The Retreat at Glacier Pointe', 'I’ll write when there’s real news on the clubhouse opening — and only then.'],
    'community-tour': ['Your Tehaleh tour', 'I’d love to show you around — trails, parks and neighborhoods. I’ll reach out to plan a time.'],
    'open-house-reminder': ['Open house reminder', 'You’re set. I’ll send one reminder before the open house.'],
    'open-house': ['Thanks for visiting ' + home, 'Thank you for stopping by the open house today.' + (v.offmarket ? ' You’re in our off-market buyer program. We don’t wait for the right home to come online; we go looking, and I’ll reach out personally when we find one that fits.' : '') + (v.value && v.address ? ' I’ll prepare your updated value report for ' + v.address + ' personally.' : '') + ' If a question comes up about the home, just reply here.'],
    'off-market': ['Welcome to our off-market buyer program', 'We don’t wait for the right home to come online. We go searching for it, and every year we help clients secure their dream homes before anyone else knows they’re available. I’ll reach out personally when we find one that fits what you told me.'],
    'home-edit': ['Your introduction', 'I’ll introduce you to one trusted ' + v.category.toLowerCase() + ' professional. Referral relationships and any fees are always disclosed before you engage anyone.']
  }[type];
  const unsub = type === 'follow' ? '<p style="font:12px Arial;color:#8A8378;margin:18px 0 0"><a style="color:#8A8378" href="' + ScriptApp.getService().getUrl() + '?api=unsub&e=' + encodeURIComponent(v.email) + '&t=' + token_(v.email) + '">Stop following this home</a></p>' : '';
  const html = shell_('<h1 style="font:400 28px/1.2 Georgia,serif;margin:0 0 16px">Thank you, ' + esc_(first) + '.</h1><p style="font:16px/1.65 Arial;margin:0 0 16px">' + esc_(copy[1]) + '</p>' +
    '<p style="font:16px/1.65 Arial;margin:0">— ' + AGENT_NAME + '</p>' + unsub);
  GmailApp.sendEmail(v.email, copy[0], copy[1] + '\n\n— ' + AGENT_NAME + '\n' + BRAND + ' · ' + AFFILIATION, { htmlBody: html, replyTo: AGENT_EMAIL, name: AGENT_NAME + ' · ' + BRAND });
}

/* Run from the editor when something changes, e.g. notifyFollowers('New price', '19917 145th St E is now $760,000.') */
function notifyFollowers(title, message) {
  const rows = tab_('Followers', FOLLOWER_HEADERS).getDataRange().getValues().slice(1).filter(r => r[3] && !r[5]);
  const seen = {};
  rows.forEach(r => {
    const email = String(r[3]).toLowerCase(); if (seen[email]) return; seen[email] = 1;
    const link = ScriptApp.getService().getUrl() + '?api=unsub&e=' + encodeURIComponent(email) + '&t=' + token_(email);
    const html = shell_('<p style="margin:0 0 6px;font:12px Arial;letter-spacing:.18em;color:#8C6A43;text-transform:uppercase">' + esc_(r[4] || 'The home you follow') + '</p><h1 style="font:400 28px/1.2 Georgia,serif;margin:0 0 14px">' + esc_(title) + '</h1><p style="font:16px/1.65 Arial;margin:0 0 16px">' + esc_(message) + '</p><p style="font:16px/1.65 Arial;margin:0"><a href="' + SITE_URL + '/19917">See the home →</a></p><p style="font:12px Arial;color:#8A8378;margin:18px 0 0"><a style="color:#8A8378" href="' + link + '">Stop following this home</a></p>');
    GmailApp.sendEmail(email, title + ' · ' + (r[4] || ''), message + '\n\nStop following: ' + link, { htmlBody: html, replyTo: AGENT_EMAIL, name: AGENT_NAME + ' · ' + BRAND });
  });
  return Object.keys(seen).length + ' followers told';
}

/* Run once from the editor: creates the Sheet, then sends you a test email. */
function setup() {
  tab_('Leads', LEAD_HEADERS); tab_('Followers', FOLLOWER_HEADERS); tab_('Activity', ACTIVITY_HEADERS);
  tab_('Sellers', SELLER_HEADERS); tab_('Seller updates', UPDATE_HEADERS); tab_('Marketing', MARKETING_HEADERS); tab_('Showings', SHOWING_HEADERS);
  notifyAgent_('tour', 'TEST — Tour request', { name: 'Test Buyer', phone: '(253) 555-0100', email: AGENT_EMAIL, agent: 'No', financing: 'Pre-approved', when: 'Saturday morning', listing: '19917 145th St E', page: 'setup', source: 'test' });
  return 'Sheet ready: ' + book_().getUrl();
}

/* ---------------- helpers ---------------- */
function details_(type, v) {
  if (type === 'tour') return 'Agent: ' + v.agent + ' · Buying: ' + v.financing + (v.when ? ' · When: ' + v.when : '');
  if (type === 'valuation') return 'Home: ' + v.address;
  if (type === 'question') return v.question;
  if (type === 'home-edit') return 'Help with: ' + v.category;
  if (type === 'open-house') return 'Agent: ' + v.agent + (v.offmarket ? ' · Off-market buyer program' : '') + (v.value ? ' · Value report' + (v.address ? ': ' + v.address : '') : '');
  if (type === 'off-market') return 'Wants: ' + (v.wants || '—') + ' · Areas: ' + (v.areas || '—');
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
  console.log('Your office password is in Project Settings → Script properties → OFFICE_KEY. Change it there to any password you like (10+ characters).');
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
function officeCall_(server, name, a) {
  a = a || {};
  if (server === 'Google Sheets') {
    const ss = book_();
    if (name === 'get_values') return { values: ss.getRange(a.range).getDisplayValues().filter(r => r.some(v => v !== '')) };
    if (name === 'append_values') { const sh = ss.getSheetByName(String(a.range).split('!')[0].replace(/'/g, '')); (a.values || []).forEach(r => sh.appendRow(r)); return { ok: true }; }
  }
  if (server === 'Gmail') {
    if (name === 'search_threads') return { threads: GmailApp.search(String(a.query || 'in:inbox'), 0, Math.min(50, a.pageSize || 20)).map(threadOut_) };
    if (name === 'create_draft') {
      const body = String(a.body || ''); let d;
      if (a.replyToMessageId) d = GmailApp.getMessageById(a.replyToMessageId).createDraftReply(body);
      else d = GmailApp.createDraft((a.to || []).join(','), String(a.subject || ''), body);
      return { id: d.getId(), viewUrl: 'https://mail.google.com/mail/u/0/#drafts' };
    }
  }
  if (server === 'Google Calendar') {
    const cal = id => CalendarApp.getCalendarById(id) || CalendarApp.getDefaultCalendar();
    if (name === 'list_events') { const c = cal(a.calendarId); return { events: c.getEvents(new Date(a.startTime), new Date(a.endTime || Date.now() + 2 * 864e5)).slice(0, a.pageSize || 25).map(ev => calOut_(c, ev)) }; }
    if (name === 'create_event') { const ev = cal(a.calendarId).createEvent(String(a.summary || 'Event'), new Date(a.startTime), new Date(a.endTime), { location: a.location || '' }); return { id: ev.getId() }; }
    if (name === 'respond_to_event') { const ev = cal(a.calendarId).getEventById(a.eventId); ev.setMyStatus(a.responseStatus === 'accepted' ? CalendarApp.GuestStatus.YES : CalendarApp.GuestStatus.NO); return { ok: true }; }
  }
  throw new Error(server + ' isn’t connected in the office yet.');
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
    if (d.op === 'ai') return { ok: true, result: officeAi_(d.prompt, d.opts) };
    return { ok: false, reason: 'unknown' };
  } catch (err) { return { ok: false, reason: String(err && err.message || err).slice(0, 300) }; }
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
