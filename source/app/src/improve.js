/* ---------- The improvement loop in the Office and the Desk (source/app/src/improve.js) ----------
   Weekly review (Approve / Not quite / I don't understand / Skip / Undo), "Something's off" (papercuts),
   seller questions from the portal ("Ask Chris": answer, or fix an auto-answer), "Seller asked…" quick log,
   section usage counts, and Arrange (move or hide sections). Playbooks: source/playbooks/.
   Host hooks: ImproveUI.init({ call, render, toast, sheet, close, where, home }) */
const ImproveUI = (() => {
  const SHEET = '1ROkc-18VbSn7kkLZYrTyJYiooMDLbBxYR0SSWItll2E', REVIEW_TASK = 'trig_01NP2yrTmhZpkDmgF4K5tv4K';
  let H = null, review = null, qs = null, busy = {}, tries = 0;
  const e = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const now = () => new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
  const vals = r => (r && (r.values || (r.valueRanges && r.valueRanges[0] && r.valueRanges[0].values))) || [];
  const local = () => !(window.claude && window.claude.use) && !H.office;
  const store = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem('imp:' + k) || 'null'); localStorage.setItem('imp:' + k, JSON.stringify(v)); } catch (x) { return null; } };
  const homeNum = s => (String(s || '').match(/^\d{3,6}/) || [''])[0];

  async function load() {
    if (!H) return;
    try {
      const [a, b] = await Promise.all([H.call('Google Sheets', 'get_values', { spreadsheetId: SHEET, range: "'Improvement review'!A1:N400" }), H.call('Google Sheets', 'get_values', { spreadsheetId: SHEET, range: "'Seller questions'!A1:K800" })]);
      review = vals(a).map((r, i) => ({ r, row: i + 1 })).slice(1); qs = vals(b).map((r, i) => ({ r, row: i + 1 })).slice(1); H.render();
    } catch (x) { if (++tries < 6) setTimeout(load, 4000); }
  }
  const set = (range, values) => H.call('Google Sheets', 'update_values', { spreadsheetId: SHEET, range, values });
  const add = (tab, values) => H.call('Google Sheets', 'append_values', { spreadsheetId: SHEET, range: `'${tab}'!A1`, values });
  const fire = (id, text) => { if (!/PENDING/.test(id)) H.call('Claude Code Remote', 'fire_trigger', { trigger_id: id, text }).catch(() => {}); };

  /* ---- weekly review ---- */
  function openItems() { return (review || []).filter(x => x.r[2] && !x.r[9]); }
  function helped() { return (review || []).filter(x => x.r[12] && x.r[11]).slice(-5); }
  function reviewHtml() {
    const items = openItems(), wk = items.length ? items[0].r[0] : '';
    const ok = helped();
    return `${ok.length ? `<div class="imp-help"><b>Did last changes help?</b>${ok.map(x => `<p>${e(x.r[2])}: ${e(x.r[12])}</p>`).join('')}</div>` : ''}
    ${items.length ? items.map(x => itemHtml(x)).join('') : '<p class="imp-s">No improvements waiting. The next review comes Monday morning.</p>'}
    ${(review || []).filter(x => x.r[11] && !x.r[13] && !/undone/i.test(x.r[13] || '')).slice(-6).length ? `<details class="imp-undo"><summary>Recent changes you approved</summary>${(review || []).filter(x => x.r[11] && !x.r[13]).slice(-6).map(x => `<div class="imp-row"><span>${e(x.r[2])} <span class="imp-s">· ${e(x.r[11])}</span></span><button class="imp-btn ghost" data-imp="undo" data-row="${x.row}">Undo</button></div>`).join('')}</details>` : ''}`;
  }
  function choices(t) { const m = String(t || '').split(/\n(?=[A-D]: )/).map(x => x.match(/^([A-D]): ([\s\S]+)$/)).filter(Boolean); return m.length >= 2 ? m.map(x => ({ k: x[1], t: x[2].trim() })) : []; }
  function itemHtml(x) {
    const r = x.r, b = busy[x.row];
    return `<div class="imp-card" id="imp-${x.row}"><div class="imp-n">${e(r[1])}</div><div class="imp-t">${e(r[2])}</div>
      <p><b>What happened:</b> ${e(r[3])}</p><p><b>What I'd change:</b> ${e(r[4])}</p>
      ${choices(r[6]).length ? `<p class="imp-s" style="margin-top:10px">Which one sounds like you?</p>${choices(r[6]).map(c => `<div class="imp-ba" style="grid-template-columns:1fr"><div><span>Version ${e(c.k)}</span>${e(c.t)}</div></div>`).join('')}`
        : r[5] || r[6] ? `<div class="imp-ba"><div><span>Before</span>${e(r[5])}</div><div><span>After</span>${e(r[6])}</div></div>` : ''}
      ${r[7] ? `<p class="imp-s">Where it shows up: ${e(r[7])}</p>` : ''}${r[8] ? `<p class="imp-s">Tested: ${e(r[8])}</p>` : ''}
      ${b === 'note' ? `<label class="imp-lab">What's not quite right? One line is plenty.<textarea class="imp-ta" data-imp-note="${x.row}" rows="2"></textarea></label><div class="imp-acts"><button class="imp-btn" data-imp="notquite-save" data-row="${x.row}">Send</button><button class="imp-btn ghost" data-imp="cancel" data-row="${x.row}">Cancel</button></div>`
        : b ? `<p class="imp-s">${e(b)}</p>` : choices(r[6]).length ? `<div class="imp-acts">${choices(r[6]).map(c => `<button class="imp-btn" data-imp="pick" data-v="${e(c.k)}" data-row="${x.row}">${e(c.k)} sounds like me</button>`).join('')}<button class="imp-btn ghost" data-imp="call" data-v="I don't understand" data-row="${x.row}">I don't understand</button><button class="imp-btn ghost" data-imp="call" data-v="Skip" data-row="${x.row}">None of these</button></div>` : `<div class="imp-acts"><button class="imp-btn" data-imp="call" data-v="Approve" data-row="${x.row}">Approve</button><button class="imp-btn ghost" data-imp="notquite" data-row="${x.row}">Not quite</button><button class="imp-btn ghost" data-imp="call" data-v="I don't understand" data-row="${x.row}">I don't understand</button><button class="imp-btn ghost" data-imp="call" data-v="Skip" data-row="${x.row}">Skip</button></div>`}</div>`;
  }
  async function call(row, v, note) {
    busy[row] = 'Saving…'; H.render();
    try { await set(`'Improvement review'!J${row}:K${row}`, [[v, note || '']]); const x = review.find(y => y.row === +row); if (x) { x.r[9] = v; x.r[10] = note || ''; }
      if (v === 'Approve') fire(REVIEW_TASK, `Chris approved improvement row ${row} ("${x ? x.r[2] : ''}"). Apply it now: weekly-review.md step 5 for this row only.`);
      delete busy[row]; H.toast(v === 'Approve' ? 'Approved. It goes live after a quick test.' : v === 'Skip' ? 'Skipped.' : v === 'Not quite' ? 'Got it. It comes back reworked next week.' : 'I’ll explain it more simply next week.'); }
    catch (err) { busy[row] = 'Not saved. Try again.'; }
    H.render();
  }

  /* ---- seller questions ---- */
  const forChris = () => (qs || []).filter(x => /^for chris/i.test(x.r[8] || '') && (!H.home || homeNum(x.r[2]) === homeNum(H.home)));
  const autoRecent = () => (qs || []).filter(x => /^auto/i.test(x.r[7] || '') && /^answered/i.test(x.r[8] || '') && (!H.home || homeNum(x.r[2]) === homeNum(H.home)) && (Date.now() - new Date(x.r[9] || x.r[0]).getTime()) < 4 * 864e5);
  function questionHtml(x, mode) {
    const r = x.r, b = busy['q' + x.row];
    return `<div class="imp-card"><div class="imp-t">${e(r[2])}${r[3] ? ` <span class="imp-s">· ${e(r[3])}</span>` : ''}</div><p class="imp-q">“${e(r[4])}”</p>
      ${mode === 'fix' ? `<p class="imp-s">Answered for you: ${e(r[6])}${r[10] ? ` <span>(from ${e(r[10])})</span>` : ''}</p>` : r[6] ? `<p class="imp-s">Sent so far: ${e(r[6])}</p>` : ''}
      ${b === 'open' ? `<textarea class="imp-ta" data-imp-ans="${x.row}" rows="3">${e(mode === 'fix' ? r[6] : '')}</textarea><div class="imp-acts"><button class="imp-btn" data-imp="${mode === 'fix' ? 'fix-save' : 'answer-save'}" data-row="${x.row}">Post to their portal</button><button class="imp-btn ghost" data-imp="qcancel" data-row="${x.row}">Cancel</button></div><p class="imp-s">Shows in their seller portal. ${new Date().getHours() >= 20 || new Date().getHours() < 8 ? 'It’s after hours, so it will show at 8 AM.' : ''}</p>`
        : b ? `<p class="imp-s">${e(b)}</p>` : `<div class="imp-acts"><button class="imp-btn${mode === 'fix' ? ' ghost' : ''}" data-imp="qopen" data-row="${x.row}">${mode === 'fix' ? 'Fix' : 'Answer'}</button></div>`}</div>`;
  }
  async function answer(row, text, fix) {
    const x = qs.find(y => y.row === +row); if (!x || !text.trim()) return;
    busy['q' + row] = 'Posting…'; H.render();
    try { await set(`'Seller questions'!G${row}:J${row}`, [[text.trim(), 'Chris', fix ? 'Fixed by Chris' : 'Answered', now()]]);
      if (fix && x.r[6] !== text.trim()) add('Edits', [[now(), H.where || 'Office', 'portal answer', 'seller', x.r[6], text.trim(), homeNum(x.r[2]), 'fixed an auto-answer']]).catch(() => {});
      x.r[6] = text.trim(); x.r[7] = 'Chris'; x.r[8] = fix ? 'Fixed by Chris' : 'Answered'; x.r[9] = now(); delete busy['q' + row]; H.toast('Posted to their portal.'); }
    catch (err) { busy['q' + row] = 'Not posted. Try again.'; }
    H.render();
  }

  /* ---- Something's off (papercut) and Seller asked… ---- */
  function offSheet() {
    H.sheet(`<p class="date">Something's off</p><h3>Tell me what happened</h3><p class="s" style="margin:-4px 0 14px">A sentence is plenty. It goes on the list for your weekly review, ahead of anything the system noticed itself.</p>
    <form id="impoff"><div class="field"><label for="io-w">Where</label><input id="io-w" name="w" placeholder="e.g. the 19917 Instagram caption" value="${e(H.home || '')}"></div>
    <div class="field"><label for="io-t">What's off</label><textarea id="io-t" name="t" required placeholder="e.g. It sounds too formal. I'd never say 'pleased to announce'."></textarea></div>
    <div class="acts"><button class="pill">Add to the list</button><button type="button" class="pill ghost" data-act="close">Cancel</button></div></form>`);
    document.getElementById('impoff').onsubmit = async ev => { ev.preventDefault(); const f = ev.target;
      try { await add('Papercuts', [[now(), 'Chris', f.w.value.trim() || (H.where || 'Office'), '', '', f.t.value.trim(), '', 'New', '', 'from Chris']]); H.close(); H.toast('Added. You’ll see it in your weekly review.'); } catch (x) { H.toast('Not saved. Try again.'); } };
  }
  function askedSheet() {
    H.sheet(`<p class="date">Seller asked…</p><h3>Log a question from a call or text</h3><p class="s" style="margin:-4px 0 14px">So the system learns what sellers ask, and when. Takes five seconds.</p>
    <form id="impask"><div class="field"><label for="ia-h">Home</label><input id="ia-h" name="h" value="${e(H.home || '')}" placeholder="19917 145th St E" required></div>
    <div class="field"><label for="ia-q">What they asked</label><input id="ia-q" name="q" required placeholder="When does the appraisal happen?"></div>
    <div class="field"><label for="ia-a">What you told them (optional)</label><input id="ia-a" name="a"></div>
    <div class="acts"><button class="pill">Save</button><button type="button" class="pill ghost" data-act="close">Cancel</button></div></form>`);
    document.getElementById('impask').onsubmit = async ev => { ev.preventDefault(); const f = ev.target;
      try { await add('Seller questions', [[now(), '', f.h.value.trim(), '', f.q.value.trim(), '', f.a.value.trim(), 'Chris (call/text)', 'Logged', now(), '']]); H.close(); H.toast('Saved.'); load(); } catch (x) { H.toast('Not saved. Try again.'); } };
  }

  function teachSheet() {
    H.sheet(`<p class="date">Teach the marketer</p><h3>Something worth learning from?</h3><p class="s" style="margin:-4px 0 14px">A link, a post you liked, an idea. It gets summarized for your marketing brain, and your weekly review shows how it would change what we make.</p>
    <form id="impteach"><div class="field"><label for="it-l">Link or idea</label><textarea id="it-l" name="l" required placeholder="https://… or “posts that show the before-and-after of a room get shared a lot”"></textarea></div>
    <div class="field"><label for="it-n">What you liked about it (optional)</label><input id="it-n" name="n"></div>
    <div class="acts"><button class="pill">Add to the marketing brain</button><button type="button" class="pill ghost" data-act="close">Cancel</button></div></form>`);
    document.getElementById('impteach').onsubmit = async ev => { ev.preventDefault(); const f = ev.target;
      try { await add('Marketing brain inbox', [[now(), f.l.value.trim(), f.n.value.trim(), 'New', '']]); H.close(); H.toast('Added. You’ll see what it teaches in your weekly review.'); } catch (x) { H.toast('Not saved. Try again.'); } };
  }

  /* ---- "This feels off": Chris names the feeling; the trail stays hidden (weekly review diagnoses it) ---- */
  const toneCtx = {}; let toneN = 0;
  const TONES = ['Too salesy', 'Too formal', 'Too fluffy', 'Too cocky', 'Trying too hard', 'Not me', 'Feels right'];
  function toneLink(where, piece, text, trail) { const id = 't' + (++toneN); toneCtx[id] = { where, piece, text, trail: Array.isArray(trail) ? trail.join(' · ') : (trail || '') };
    return `<button class="imp-link" style="font-size:12px;padding:2px 0" data-imp="tone" data-id="${id}">This feels off</button>`; }
  function toneSheet(id) { const c = toneCtx[id] || {};
    H.sheet(`<p class="date">This feels off</p><h3>How does it feel?</h3><p class="s" style="margin:-4px 0 12px">Just the feeling. You don't need to know why; I'll figure out what caused it and show you a couple of versions to pick from.</p>
    <form id="imptone"><div class="imp-chips">${TONES.map(t => `<label class="imp-chip"><input type="radio" name="t" value="${e(t)}" required><span>${e(t)}</span></label>`).join('')}</div>
    <div class="field" style="margin-top:12px"><label for="itn-w">In your words (optional)</label><input id="itn-w" name="w" placeholder="e.g. sounds like a commercial"></div>
    <div class="acts"><button class="pill">Send</button><button type="button" class="pill ghost" data-act="close">Cancel</button></div></form>`);
    document.getElementById('imptone').onsubmit = async ev => { ev.preventDefault(); const f = ev.target, t = (f.querySelector('input[name=t]:checked') || {}).value;
      try { await add('Tone reports', [[now(), c.where || H.where || 'Office', c.piece || '', t, f.w.value.trim(), String(c.text || '').slice(0, 4000), c.trail || '', 'New', '']]); H.close(); H.toast(t === 'Feels right' ? 'Saved as a good example.' : 'Got it. You’ll see a couple of versions to pick from in your weekly review.'); } catch (x) { H.toast('Not saved. Try again.'); } }; }

  /* ---- usage: which sections Chris taps (counts only, no scrolling) ---- */
  function bump(sec) { const d = new Date().toISOString().slice(0, 10), u = store('use') || {}; u[d] = u[d] || {}; const k = sec; u[d][k] = u[d][k] || { t: 0, s: 0 }; u[d][k].t++;
    const ses = store('ses') || {}; if (!ses[d + k] || Date.now() - ses[d + k] > 30 * 60e3) u[d][k].s++; ses[d + k] = Date.now(); store('ses', ses); store('use', u); }
  async function flush() { if (local()) return; const u = store('use') || {}, today = new Date().toISOString().slice(0, 10), rows = [];
    Object.keys(u).filter(d => d < today).forEach(d => Object.keys(u[d]).forEach(k => rows.push([d, H.where || 'Office', k, u[d][k].s, u[d][k].t])));
    if (!rows.length) return; try { await add('Usage', rows); Object.keys(u).filter(d => d < today).forEach(d => delete u[d]); store('use', u); } catch (x) {} }

  /* ---- Arrange: move or hide sections (saved on this device; the weekly review may suggest changes) ---- */
  function arrange(wrap) { if (!wrap) return; const def = (typeof OFFICE_LAYOUT !== 'undefined' && OFFICE_LAYOUT[H.where || 'Office']) || {}, order = store('order:' + (H.where || 'Office')) || def.order || [], hidden = store('hidden:' + (H.where || 'Office')) || def.hidden || [];
    const secs = [...wrap.querySelectorAll(':scope > section[aria-label]')]; if (!secs.length) return;
    const anchor = secs[0].previousElementSibling, by = {}; secs.forEach(s => by[s.getAttribute('aria-label')] = s);
    const names = order.filter(n => by[n]).concat(secs.map(s => s.getAttribute('aria-label')).filter(n => !order.includes(n)));
    let after = anchor; names.forEach(n => { const s = by[n]; s.hidden = hidden.includes(n); if (after) after.after(s); else wrap.prepend(s); after = s; }); }
  function arrangeSheet(wrap) { const secs = [...wrap.querySelectorAll(':scope > section[aria-label]')].map(s => s.getAttribute('aria-label')), hidden = store('hidden:' + (H.where || 'Office')) || [];
    H.sheet(`<p class="date">Arrange</p><h3>Your sections</h3><p class="s" style="margin:-4px 0 14px">Move what you use most to the top. Hidden sections come back any time.</p>
    <div class="imp-arr">${secs.map((n, i) => `<div class="imp-row"><span>${e(n)}${hidden.includes(n) ? ' <span class="imp-s">· hidden</span>' : ''}</span><span><button class="imp-btn ghost" data-imp="up" data-n="${e(n)}" ${i ? '' : 'disabled'}>↑</button> <button class="imp-btn ghost" data-imp="down" data-n="${e(n)}" ${i < secs.length - 1 ? '' : 'disabled'}>↓</button> <button class="imp-btn ghost" data-imp="hide" data-n="${e(n)}">${hidden.includes(n) ? 'Show' : 'Hide'}</button></span></div>`).join('')}</div>
    <div class="acts"><button class="pill" data-act="close">Done</button></div>`); }

  document.addEventListener('click', async ev => {
    if (!H) return;
    const sec = ev.target.closest && ev.target.closest('section[aria-label], .sharebar[id]'); if (sec && !ev.target.closest('#sheet')) bump(sec.getAttribute('aria-label') || sec.id);
    const b = ev.target.closest && ev.target.closest('[data-imp]'); if (!b) return; ev.preventDefault();
    const a = b.dataset.imp, row = b.dataset.row;
    if (a === 'call') return call(row, b.dataset.v);
    if (a === 'notquite') { busy[row] = 'note'; return H.render(); }
    if (a === 'notquite-save') { const t = document.querySelector(`[data-imp-note="${row}"]`); return call(row, 'Not quite', t ? t.value : ''); }
    if (a === 'cancel') { delete busy[row]; return H.render(); }
    if (a === 'undo') { try { await set(`'Improvement review'!N${row}`, [['Undo']]); const x = review.find(y => y.row === +row); if (x) x.r[13] = 'Undo'; fire(REVIEW_TASK, `Chris tapped Undo on improvement row ${row}. Undo it now: weekly-review.md step 5.`); H.toast('Undoing it now.'); } catch (x) { H.toast('Not saved. Try again.'); } return H.render(); }
    if (a === 'qopen') { busy['q' + row] = 'open'; return H.render(); }
    if (a === 'qcancel') { delete busy['q' + row]; return H.render(); }
    if (a === 'answer-save' || a === 'fix-save') { const t = document.querySelector(`[data-imp-ans="${row}"]`); return answer(row, t ? t.value : '', a === 'fix-save'); }
    if (a === 'off') return offSheet();
    if (a === 'asked') return askedSheet();
    if (a === 'teach') return teachSheet();
    if (a === 'tone') return toneSheet(b.dataset.id);
    if (a === 'pick') { const x = (review || []).find(y => y.row === +row); if (x) fire(REVIEW_TASK, `Chris picked version ${b.dataset.v} on improvement row ${row}. Apply what that choice shows (weekly-review.md step 5).`); return call(row, 'Picked ' + b.dataset.v); }
    if (a === 'review') return H.sheet(`<p class="date">Weekly review</p><h3>Ways to make it better</h3><p class="s" style="margin:-4px 0 14px">Each one is a small change, tested before it goes live. Nothing changes without your OK.</p><div id="impbody">${reviewHtml()}</div><div class="acts"><button class="pill ghost" data-act="close">Close</button></div>`);
    if (a === 'questions') return H.sheet(`<p class="date">Seller questions</p><h3>From the seller portals</h3><div id="impq">${questionsBody()}</div><div class="acts"><button class="pill ghost" data-act="close">Close</button></div>`);
    if (a === 'arrange') return arrangeSheet(H.wrap());
    if (a === 'up' || a === 'down' || a === 'hide') { const k = H.where || 'Office', wrap = H.wrap(), secs = [...wrap.querySelectorAll(':scope > section[aria-label]')].map(s => s.getAttribute('aria-label')), n = b.dataset.n, i = secs.indexOf(n);
      if (a === 'hide') { const h = store('hidden:' + k) || [], j = h.indexOf(n); j >= 0 ? h.splice(j, 1) : h.push(n); store('hidden:' + k, h); }
      else { const t = a === 'up' ? i - 1 : i + 1; if (t >= 0 && t < secs.length) { [secs[i], secs[t]] = [secs[t], secs[i]]; store('order:' + k, secs); } }
      arrange(wrap); return arrangeSheet(wrap); }
  });
  function questionsBody() { const a = forChris(), f = autoRecent(); return `${a.length ? `<p class="imp-h">Waiting for you</p>${a.map(x => questionHtml(x, 'answer')).join('')}` : '<p class="imp-s">No questions waiting for you.</p>'}${f.length ? `<p class="imp-h">Answered for you (last 4 days)</p>${f.map(x => questionHtml(x, 'fix')).join('')}` : ''}`; }
  function refreshSheet() { const r = document.getElementById('impbody'); if (r) r.innerHTML = reviewHtml(); const q = document.getElementById('impq'); if (q) q.innerHTML = questionsBody(); }

  /* ---- Needs-you items for the host ---- */
  function needs() {
    const out = [], items = openItems(), w = forChris(), f = autoRecent();
    if (items.length) out.push({ t: `Weekly review: ${items.length} way${items.length > 1 ? 's' : ''} to make it better`, s: 'About 3 minutes. Each one is tested before it goes live, and nothing changes without your OK.', acts: `<button class="pill" data-imp="review">Review</button>` });
    if (w.length) out.push({ t: `Seller question${w.length > 1 ? 's' : ''} for you: ${w.length}`, s: w.slice(0, 2).map(x => `${homeNum(x.r[2])}: “${String(x.r[4]).slice(0, 70)}”`).join(' · '), acts: `<button class="pill" data-imp="questions">Answer</button>` });
    if (f.length) out.push({ t: `Answered for you: ${f.length}`, s: 'Factual questions from sellers, answered from the contract and your TC’s records. Tap to check or fix.', acts: `<button class="pill ghost" data-imp="questions">See them</button>` });
    return out;
  }
  const tools = () => `<div class="imp-tools"><button class="imp-link" data-imp="off">Something’s off</button><button class="imp-link" data-imp="asked">Seller asked…</button><button class="imp-link" data-imp="teach">Teach the marketer</button>${H && H.wrap ? '<button class="imp-link" data-imp="arrange">Arrange</button>' : ''}<button class="imp-link" data-imp="review">Weekly review</button></div>`;
  const CSS = `.imp-card{border:1px solid rgba(128,120,108,.28);border-radius:14px;padding:14px 16px;margin:12px 0;background:rgba(128,120,108,.05)}.imp-card p{margin:8px 0;line-height:1.5}.imp-n{font-size:12px;opacity:.6}.imp-t{font-weight:600;font-size:16px;margin-top:2px}
.imp-ba{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.imp-ba div{border-radius:10px;padding:10px;background:rgba(128,120,108,.08);font-size:14px;line-height:1.45}.imp-ba span{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.6;margin-bottom:4px}
.imp-s{font-size:13px;opacity:.72}.imp-h{font-weight:600;margin:14px 0 2px}.imp-q{font-size:16px}.imp-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.imp-btn{border:0;border-radius:999px;padding:9px 16px;font-family:inherit;font-weight:600;font-size:13px;line-height:1;background:var(--btn,#1C1B19);color:var(--btnText,#F6F2EB);cursor:pointer}
.imp-btn.ghost{background:transparent;color:inherit;border:1px solid rgba(128,120,108,.45)}.imp-btn[disabled]{opacity:.35}.imp-ta{display:block;width:100%;box-sizing:border-box;margin-top:6px;font-family:inherit;font-size:14px;line-height:1.45;padding:8px 10px;border-radius:8px;border:1px solid rgba(128,120,108,.4);background:transparent;color:inherit}.imp-lab{display:block;font-size:13px;margin-top:8px}
.imp-help{border-radius:12px;padding:10px 14px;background:rgba(63,107,69,.10);margin:6px 0}.imp-help p{margin:4px 0;font-size:14px}.imp-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(128,120,108,.18)}
.imp-tools{display:flex;flex-wrap:wrap;gap:6px 16px;justify-content:center;margin:18px 0 6px}.imp-link{border:0;background:none;color:inherit;opacity:.7;font-family:inherit;font-size:13px;text-decoration:underline;cursor:pointer;padding:4px}.imp-undo{margin-top:12px}.imp-chips{display:flex;flex-wrap:wrap;gap:8px}.imp-chip input{position:absolute;opacity:0}.imp-chip span{display:inline-block;padding:8px 14px;border-radius:999px;border:1px solid rgba(128,120,108,.45);font-size:14px;cursor:pointer}.imp-chip input:checked+span{background:var(--btn,#1C1B19);color:var(--btnText,#F6F2EB);border-color:transparent}#imptone .pill{border:0;border-radius:999px;padding:10px 18px;font-family:inherit;font-weight:600;font-size:14px;background:var(--btn,#1C1B19);color:var(--btnText,#F6F2EB);cursor:pointer}#imptone .pill.ghost{background:transparent;color:inherit;border:1px solid rgba(128,120,108,.45)}#impoff .pill,#impask .pill,#impteach .pill{border:0;border-radius:999px;padding:10px 18px;font-family:inherit;font-weight:600;font-size:14px;background:var(--btn,#1C1B19);color:var(--btnText,#F6F2EB);cursor:pointer}#impoff .pill.ghost,#impask .pill.ghost,#impteach .pill.ghost{background:transparent;color:inherit;border:1px solid rgba(128,120,108,.45)}.imp-undo summary{cursor:pointer;font-size:13px;opacity:.75}`;
  return {
    init(h) { H = h; if (!document.getElementById('imp-css')) { const s = document.createElement('style'); s.id = 'imp-css'; s.textContent = CSS; document.head.appendChild(s); }
      const r = H.render; H.render = () => { r(); refreshSheet(); if (H.wrap) arrange(H.wrap()); }; load(); flush(); setInterval(flush, 15 * 60e3); setInterval(load, 5 * 60e3); },
    needs, tools, toneLink, reload: load, arrange: w => arrange(w), questionsFor: home => (qs || []).filter(x => homeNum(x.r[2]) === homeNum(home))
  };
})();
