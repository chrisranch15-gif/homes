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
  'home-edit':           { label: 'Home Edit introduction',     needs: ['name', 'phone', 'email', 'category'] }
};
const LEAD_HEADERS = ['Received', 'Type', 'Name', 'Phone', 'Email', 'Details', 'Home', 'Page', 'Came from', 'Status'];
const ACTIVITY_HEADERS = ['When', 'What', 'Page', 'Came from', 'Visitor', 'Sign'];
const FOLLOWER_HEADERS = ['Since', 'Name', 'Phone', 'Email', 'Home', 'Unsubscribed'];

/* ---------------- web endpoints ---------------- */
function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, reason: 'Bad request' }); }
  const type = String(d.type || '');
  if (type === 'visit' || type === 'scan') {
    tab_('Activity', ACTIVITY_HEADERS).appendRow([new Date(), type === 'scan' ? 'Sign scan' : 'Visit · ' + clean_(d.view, 20), clean_(d.page, 30), clean_(d.source, 40), clean_(d.visitor, 20), clean_(d.sign, 20)]);
    return out_({ ok: true });
  }
  if (d.website) return out_({ ok: true });               // hidden field: bots only
  const t = TYPES[type];
  if (!t) return out_({ ok: false, reason: 'Unknown request' });
  const v = {
    name: clean_(d.name, 80), phone: clean_(d.phone, 30), email: clean_(d.email, 120).toLowerCase(),
    agent: clean_(d.agent, 10), financing: clean_(d.financing, 20), when: clean_(d.when, 120),
    address: clean_(d.address, 160), question: clean_(d.question, 600), category: clean_(d.category, 40),
    listing: clean_(d.listing, 80), page: clean_(d.page, 30), source: clean_(d.source, 40)
  };
  for (const k of t.needs) if (!v[k]) return out_({ ok: false, reason: 'Please fill in every field.' });
  if (v.phone.replace(/\D/g, '').length < 10) return out_({ ok: false, reason: 'Please add a phone number with area code.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) return out_({ ok: false, reason: 'Please add a valid email.' });

  // the same person pressing twice within two minutes counts once
  const cache = CacheService.getScriptCache(), key = 'dup:' + type + ':' + v.email;
  if (cache.get(key)) return out_({ ok: true, duplicate: true });
  cache.put(key, '1', 120);

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return out_({ ok: false, reason: 'Busy for a moment — please try again.' });
  try {
    const details = details_(type, v);
    tab_('Leads', LEAD_HEADERS).appendRow([new Date(), t.label, v.name, v.phone, v.email, details, v.listing, v.page, v.source, 'New']);
    if (type === 'follow') tab_('Followers', FOLLOWER_HEADERS).appendRow([new Date(), v.name, v.phone, v.email, v.listing, '']);
  } finally { lock.releaseLock(); }

  try { notifyAgent_(type, t.label, v); } catch (err) { console.error('agent email', err); }
  try { confirm_(type, v); } catch (err) { console.error('confirmation', err); }
  return out_({ ok: true });
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.api === 'ping') return out_({ ok: true, at: new Date().toISOString() });
  if (p.api === 'unsub' && p.e && p.t === token_(p.e)) {
    const sh = tab_('Followers', FOLLOWER_HEADERS), rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) if (String(rows[i][3]).toLowerCase() === String(p.e).toLowerCase() && !rows[i][5]) sh.getRange(i + 1, 6).setValue(new Date());
    return HtmlService.createHtmlOutput('<div style="font:17px/1.6 Georgia,serif;max-width:480px;margin:80px auto;padding:0 24px;color:#1E2327"><p style="letter-spacing:.2em;font:12px Arial;color:#8C6A43">' + BRAND.toUpperCase() + '</p><h1 style="font-weight:400">You’re unsubscribed.</h1><p>You won’t get any more updates about this home. Thank you for following it.</p></div>');
  }
  return out_({ ok: true });
}

/* ---------------- emails ---------------- */
function notifyAgent_(type, label, v) {
  const first = v.name.split(' ')[0];
  const rows = [['Phone', '<a href="tel:' + v.phone.replace(/[^\d+]/g, '') + '">' + esc_(v.phone) + '</a> &nbsp;·&nbsp; <a href="sms:' + v.phone.replace(/[^\d+]/g, '') + '">Text</a>'],
    ['Email', '<a href="mailto:' + esc_(v.email) + '">' + esc_(v.email) + '</a>']];
  if (type === 'tour') rows.push(['Working with an agent', esc_(v.agent)], ['Buying', esc_(v.financing)]);
  if (v.when) rows.push(['Preferred time', esc_(v.when)]);
  if (v.address) rows.push(['Their home', esc_(v.address)]);
  if (v.question) rows.push(['Question', esc_(v.question)]);
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
  notifyAgent_('tour', 'TEST — Tour request', { name: 'Test Buyer', phone: '(253) 555-0100', email: AGENT_EMAIL, agent: 'No', financing: 'Pre-approved', when: 'Saturday morning', listing: '19917 145th St E', page: 'setup', source: 'test' });
  return 'Sheet ready: ' + book_().getUrl();
}

/* ---------------- helpers ---------------- */
function details_(type, v) {
  if (type === 'tour') return 'Agent: ' + v.agent + ' · Buying: ' + v.financing + (v.when ? ' · When: ' + v.when : '');
  if (type === 'valuation') return 'Home: ' + v.address;
  if (type === 'question') return v.question;
  if (type === 'home-edit') return 'Help with: ' + v.category;
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
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
