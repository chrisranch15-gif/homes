/* ---------- Social posts: previews and Approve, shared by the Office and the Desk (source/app/src/social.js) ----------
   Posts are made by source/marketing/social.py (designer) from source/marketing/social/<key>-<event>.json (copy).
   Chris sees each post as it will look on Instagram, Facebook, Stories and Google, can edit the caption and the time,
   and taps Approve. Only that tap schedules it in Metricool. Nothing posts on its own.
   Host hooks: SocialUI.init({ call(server, tool, input), render(), toast(msg), base, where }) */
const SocialUI = (() => {
  const MC = 'Metricool Social Media Management', BRAND = '6646044', TZ = 'America/Los_Angeles';
  const SHEET = '1ROkc-18VbSn7kkLZYrTyJYiooMDLbBxYR0SSWItll2E', TAB = 'Social posts';
  let H = null, log = null, st = {};   // st[postKey] = { open, edit, text, when, busy, err, idx }
  const e = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const pk = (set, p) => `${set.key}|${set.event}|${p.id}`;
  const S = k => (st[k] = st[k] || {});
  const NET = { instagram: 'Instagram', facebook: 'Facebook', gmb: 'Google Business Profile', 'instagram,facebook': 'Instagram + Facebook stories' };
  const isLocal = () => !(window.claude && window.claude.use);
  function scheduled(set, p) { return (log || []).find(r => r[1] === set.key && r[2] === set.event && r[3] === p.id && /^scheduled/i.test(r[6] || '')); }
  let tries = 0;
  async function loadLog() {   // which posts Chris already approved (the Social posts tab); retried while the connection wakes up
    if (!H || isLocal()) return;
    try { const r = await H.call('Google Sheets', 'get_values', { spreadsheetId: SHEET, range: `'${TAB}'!A1:H400` }); log = (r && (r.values || (r.valueRanges && r.valueRanges[0].values))) || []; H.render(); }
    catch (x) { if (++tries < 6) setTimeout(loadLog, 4000); }
  }
  function sets() { return (typeof SOCIAL !== 'undefined' ? SOCIAL : []) || []; }
  function waiting(key) { return sets().filter(s => !key || s.key === key).map(s => ({ set: s, posts: s.posts.filter(p => !scheduled(s, p)) })).filter(x => x.posts.length); }
  function caption(set, p) { const s = S(pk(set, p)); return s.text != null ? s.text : p.caption; }
  function whenVal(set, p) { const s = S(pk(set, p)); return s.when || p.when; }
  function nice(w) { const d = new Date(w); return isNaN(d) ? w : d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  const img = (set, p, i) => e((H.base || '') + p.th[i]);

  /* ---- the previews: drawn the way each network shows a post ---- */
  function slider(set, p, k, ratio) {
    const i = S(k).idx || 0, n = p.th.length;
    return `<div class="socp-media" style="aspect-ratio:${ratio}"><img src="${img(set, p, i)}" alt="${e(set.title)} · ${i + 1} of ${n}">
      ${n > 1 ? `${i > 0 ? `<button class="socp-nav l" data-soc="prev" data-k="${e(k)}" aria-label="Previous">‹</button>` : ''}${i < n - 1 ? `<button class="socp-nav r" data-soc="next" data-k="${e(k)}" aria-label="Next">›</button>` : ''}<span class="socp-count">${i + 1}/${n}</span>` : ''}</div>
      ${n > 1 ? `<div class="socp-dots">${p.th.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>` : ''}`;
  }
  function capHtml(t, more) {
    const lines = e(t).replace(/(#\w+)/g, '<span class="socp-tag">$1</span>').replace(/(https?:\/\/\S+)/g, '<span class="socp-tag">$1</span>');
    return `<div class="socp-cap${more ? '' : ' clip'}">${lines}</div>`;
  }
  function preview(set, p) {
    const k = pk(set, p), s = S(k), t = caption(set, p);
    const av = `<span class="socp-av">R</span>`;
    if (p.network === 'instagram') return `<div class="socp-phone ig"><div class="socp-head">${av}<b>ranchrealestategroup</b><span class="socp-sub">${e(set.area || 'Tehaleh')}</span></div>
      ${slider(set, p, k, '4/5')}<div class="socp-icons">♡ ◯ ➢<span style="margin-left:auto">⌑</span></div>
      <div class="socp-body"><b>ranchrealestategroup</b> ${capHtml(t, s.more)}${!s.more ? `<button class="socp-more" data-soc="more" data-k="${e(k)}">more</button>` : ''}</div></div>`;
    if (p.network === 'facebook') return `<div class="socp-phone fb"><div class="socp-head">${av}<div><b>The Ranch Real Estate Group</b><span class="socp-sub">Scheduled · ${e(nice(whenVal(set, p)))} · 🌐</span></div></div>
      <div class="socp-body" style="padding-top:2px">${capHtml(t, s.more)}${!s.more ? `<button class="socp-more" data-soc="more" data-k="${e(k)}">See more</button>` : ''}</div>
      ${slider(set, p, k, '4/5')}<div class="socp-icons fb">👍 Like<span>💬 Comment</span><span>↗ Share</span></div></div>`;
    if (p.format === 'story') { const i = s.idx || 0; return `<div class="socp-phone story"><div class="socp-media" style="aspect-ratio:9/16"><img src="${img(set, p, i)}" alt="Story ${i + 1}">
      <div class="socp-bars">${p.th.map((_, j) => `<i class="${j <= i ? 'on' : ''}"></i>`).join('')}</div><div class="socp-shead">${av}<b>ranchrealestategroup</b><span>now</span></div>
      ${i > 0 ? `<button class="socp-nav l" data-soc="prev" data-k="${e(k)}" aria-label="Previous">‹</button>` : ''}${i < p.th.length - 1 ? `<button class="socp-nav r" data-soc="next" data-k="${e(k)}" aria-label="Next">›</button>` : ''}</div></div>`; }
    return `<div class="socp-phone gbp"><div class="socp-head"><span class="socp-av g">R</span><div><b>The Ranch Real Estate Group</b><span class="socp-sub">Update · Google</span></div></div>
      ${slider(set, p, k, '4/3')}<div class="socp-body">${capHtml(t, s.more)}${!s.more ? `<button class="socp-more" data-soc="more" data-k="${e(k)}">More</button>` : ''}</div>
      <div style="padding:0 14px 14px"><span class="socp-cta">Call now</span></div></div>`;
  }
  function card(set, p) {
    const k = pk(set, p), s = S(k), done = scheduled(set, p), t = caption(set, p);
    const local = isLocal();
    return `<div class="socp-card" id="soc-${e(k.replace(/\W/g, '-'))}">
      <div class="socp-top"><div><div class="socp-net">${e(NET[p.network] || p.network)} · ${e(p.kind)}</div><div class="socp-when">${done ? `Scheduled · ${e(nice(done[5]))}` : `Goes out ${e(nice(whenVal(set, p)))}`}</div></div>${done ? '<span class="socp-ok">✓ Scheduled</span>' : ''}</div>
      ${preview(set, p)}
      ${done ? (done[7] ? `<a class="socp-link" href="${e(done[7])}" target="_blank" rel="noopener">See it in Metricool</a>` : '') : `
      ${s.edit ? `<label class="socp-lab">Caption${p.network === 'gmb' ? ' (Google allows 1,500 characters)' : ''}<textarea class="socp-ta" data-soc-text="${e(k)}" rows="8">${e(t)}</textarea></label>
        <label class="socp-lab">Goes out<input class="socp-dt" type="datetime-local" data-soc-when="${e(k)}" value="${e(whenVal(set, p))}"></label>` : ''}
      ${s.err ? `<p class="socp-err">${e(s.err)}</p>` : ''}
      <div class="socp-acts">${local ? `<span class="socp-note">Approve from your Office in the Claude app, where Metricool is connected.</span>` : `<button class="socp-btn" data-soc="approve" data-k="${e(k)}" ${s.busy ? 'disabled' : ''}>${s.busy ? 'Scheduling…' : 'Approve'}</button>`}
        <button class="socp-btn ghost" data-soc="edit" data-k="${e(k)}">${s.edit ? 'Done editing' : 'Edit'}</button>
        <a class="socp-btn ghost" href="${e(p.urls[0])}" target="_blank" rel="noopener">Full size</a>${typeof ImproveUI !== 'undefined' ? ImproveUI.toneLink(H.where || 'Office', `${set.key} ${set.event} · ${p.id}`, caption(set, p), p.trail) : ''}</div>
      ${!local ? `<p class="socp-note">Approve schedules it for the time above${p.network === 'gmb' ? '' : ''}. Want a different photo or line? Tell the Concierge and it comes back here for your OK.</p>` : ''}`}
    </div>`;
  }
  function html(key) {
    const all = sets().filter(s => !key || s.key === key);
    if (!all.length) return '';
    return all.map(set => `<div class="socp-set"><div class="socp-title">${e(set.title)}</div><div class="socp-grid">${set.posts.map(p => card(set, p)).join('')}</div>
      ${set.posts.some(p => !scheduled(set, p)) && !isLocal() && set.posts.filter(p => !scheduled(set, p)).length > 1 ? `<div class="socp-acts" style="margin-top:6px"><button class="socp-btn" data-soc="approve-all" data-k="${e(set.key + '|' + set.event)}">Approve all ${set.posts.filter(p => !scheduled(set, p)).length}</button></div>` : ''}</div>`).join('');
  }

  /* ---- Approve: one tap by Chris schedules exactly what he saw ---- */
  const iso = w => { if (w.length !== 16) return w; let off = '-08:00'; try { const n = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'longOffset' }).formatToParts(new Date(w)).find(x => x.type === 'timeZoneName'); if (n && /GMT[+-]\d\d:\d\d/.test(n.value)) off = n.value.slice(3); } catch (x) {} return `${w}:00${off}`; };
  const addMin = (w, m) => { const d = new Date(new Date(w).getTime() + m * 60e3), z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`; };
  function infoFor(p, text, when, media) {
    const nets = p.network.split(','), story = p.format === 'story';
    const i = { autoPublish: true, draft: false, descendants: [], firstCommentText: '', hasNotReadNotes: false, media, mediaAltText: [], shortener: false, smartLinkData: { ids: [] },
      providers: nets.map(n => ({ network: n })), publicationDate: { dateTime: when.length === 16 ? when + ':00' : when, timezone: TZ } };
    if (!story) i.text = text;
    if (nets.includes('instagram')) i.instagramData = { type: story ? 'STORY' : 'POST', isAiGenerated: false };
    if (nets.includes('facebook')) i.facebookData = { type: story ? 'STORY' : 'POST' };
    if (nets.includes('gmb')) i.gmbData = { type: 'publication' };
    return i;
  }
  async function approve(set, p) {
    const k = pk(set, p), s = S(k), text = caption(set, p), when = whenVal(set, p);
    if (new Date(when) < new Date(Date.now() + 5 * 60e3)) { s.err = 'That time has passed. Tap Edit and pick a new time.'; H.render(); return; }
    if (p.network === 'gmb' && text.length > 1500) { s.err = `Google allows 1,500 characters; this is ${text.length}.`; H.render(); return; }
    s.busy = true; s.err = ''; H.render();
    try {
      const jobs = p.format === 'story' ? p.urls.map((u, i) => [addMin(when, i * 5), [u]]) : [[when, p.urls]];
      let link = '';
      for (const [w, media] of jobs) {
        const r = await H.call(MC, 'createScheduledPost', { blogId: BRAND, date: iso(w), info: JSON.stringify(infoFor(p, text, w, media)) });
        const j = typeof r === 'string' ? (() => { try { return JSON.parse(r); } catch (x) { return { raw: r }; } })() : r;
        link = link || (j && (j.plannerUrl || (j.data && j.data.plannerUrl) || (Array.isArray(j) && j[0] && j[0].plannerUrl))) || 'https://app.metricool.com/planner';
      }
      const row = [new Date().toLocaleString('en-US', { timeZone: TZ }), set.key, set.event, p.id, p.network, when, 'Scheduled · approved by Chris in the ' + (H.where || 'Office'), link];
      (log = log || []).push(row); s.busy = false; s.edit = false;
      H.call('Google Sheets', 'append_values', { spreadsheetId: SHEET, range: `'${TAB}'!A1`, values: [row] }).catch(() => {});
      if (text.trim() !== String(p.caption || '').trim()) H.call('Google Sheets', 'append_values', { spreadsheetId: SHEET, range: "'Edits'!A1", values: [[row[0], H.where || 'Office', 'caption', NET[p.network] || p.network, p.caption, text, set.key, set.event + ' · ' + p.id]] }).catch(() => {});
      if (when !== p.when) H.call('Google Sheets', 'append_values', { spreadsheetId: SHEET, range: "'Edits'!A1", values: [[row[0], H.where || 'Office', 'post time', NET[p.network] || p.network, p.when, when, set.key, set.event + ' · ' + p.id]] }).catch(() => {});
      H.toast(`${NET[p.network] || p.network}: scheduled for ${nice(when)}.`);
    } catch (x) { s.busy = false; s.err = 'Metricool said: ' + ((x && (x.message || x.code)) || 'it couldn’t schedule this') + '. Nothing was posted.'; }
    H.render();
  }
  function find(k) { for (const set of sets()) for (const p of set.posts) if (pk(set, p) === k) return [set, p]; return []; }
  document.addEventListener('click', async ev => {
    const b = ev.target.closest && ev.target.closest('[data-soc]'); if (!b || !H) return;
    ev.preventDefault(); const k = b.dataset.k, a = b.dataset.soc;
    if (a === 'approve-all') { for (const set of sets()) if (set.key + '|' + set.event === k) for (const p of set.posts) if (!scheduled(set, p)) await approve(set, p); return; }
    const [set, p] = find(k); if (!p) return; const s = S(k);
    if (a === 'next') s.idx = Math.min((s.idx || 0) + 1, p.th.length - 1);
    if (a === 'prev') s.idx = Math.max((s.idx || 0) - 1, 0);
    if (a === 'more') s.more = true;
    if (a === 'edit') s.edit = !s.edit;
    if (a === 'approve') return approve(set, p);
    H.render();
  });
  document.addEventListener('input', ev => { const t = ev.target; if (!t.dataset) return;
    if (t.dataset.socText) S(t.dataset.socText).text = t.value;
    if (t.dataset.socWhen) S(t.dataset.socWhen).when = t.value; });
  const CSS = `.socp-set{margin-top:12px}.socp-title{font-weight:600;margin:4px 0 10px}.socp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:16px;align-items:start}
.socp-card{border:1px solid rgba(128,120,108,.25);border-radius:14px;padding:12px;background:rgba(128,120,108,.05)}.socp-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:10px}
.socp-net{font-size:13px;font-weight:600}.socp-when{font-size:12px;opacity:.7;margin-top:2px}.socp-ok{font-size:12px;font-weight:600;color:#2f6b3a;white-space:nowrap}
.socp-phone{background:#fff;color:#111;border-radius:12px;overflow:hidden;font:13px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;box-shadow:0 1px 3px rgba(0,0,0,.12)}
.socp-head{display:flex;align-items:center;gap:8px;padding:10px 12px}.socp-head b{font-size:13px;display:block}.socp-sub{display:block;font-size:11px;color:#65676b}
.socp-av{width:30px;height:30px;border-radius:50%;background:#1C1B19;color:#E8D9C3;display:inline-flex;align-items:center;justify-content:center;font:600 13px Georgia,serif;flex:none}.socp-av.g{background:#1a73e8;color:#fff}
.socp-media{position:relative;background:#111}.socp-media img{width:100%;height:100%;object-fit:cover;display:block}.socp-count{position:absolute;top:10px;right:10px;background:rgba(0,0,0,.6);color:#fff;font-size:11px;padding:2px 8px;border-radius:10px}
.socp-nav{position:absolute;top:50%;transform:translateY(-50%);width:28px;height:28px;border-radius:50%;border:0;background:rgba(255,255,255,.85);color:#111;font-size:18px;line-height:1;cursor:pointer}.socp-nav.l{left:8px}.socp-nav.r{right:8px}
.socp-dots{display:flex;justify-content:center;gap:4px;padding:8px 0 0}.socp-dots i{width:6px;height:6px;border-radius:50%;background:#c7c7c7}.socp-dots i.on{background:#0095f6}
.socp-icons{display:flex;gap:14px;padding:8px 12px 4px;font-size:16px}.socp-icons.fb{justify-content:space-around;font-size:12px;color:#65676b;border-top:1px solid #e4e6eb;padding:8px 6px}
.socp-body{padding:4px 12px 12px}.socp-cap{white-space:pre-wrap;display:inline}.socp-cap.clip{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.socp-tag{color:#00376b}.fb .socp-tag{color:#385898}
.socp-more{border:0;background:none;color:#737373;padding:0;font:inherit;cursor:pointer}.socp-cta{display:inline-block;border:1px solid #dadce0;color:#1a73e8;border-radius:18px;padding:6px 14px;font-size:13px}
.socp-phone.story{background:#000;max-width:240px;margin:0 auto}.socp-bars{position:absolute;top:8px;left:8px;right:8px;display:flex;gap:3px}.socp-bars i{flex:1;height:2px;background:rgba(255,255,255,.4)}.socp-bars i.on{background:#fff}
.socp-shead{position:absolute;top:16px;left:10px;display:flex;align-items:center;gap:6px;color:#fff;font-size:12px}.socp-shead span{opacity:.7}.socp-shead .socp-av{width:24px;height:24px;font-size:11px}
.socp-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;align-items:center}.socp-btn{border:0;border-radius:999px;padding:9px 16px;font-family:inherit;font-weight:600;font-size:13px;line-height:1;display:inline-block;background:var(--ink,#1C1B19);color:var(--paper,#F6F2EB);cursor:pointer;text-decoration:none}
.socp-btn.ghost{background:transparent;color:inherit;border:1px solid rgba(128,120,108,.45)}.socp-btn[disabled]{opacity:.6}.socp-note{font-size:12px;opacity:.7;margin:8px 0 0}.socp-err{font-size:12px;color:#a33;margin:8px 0 0}
.socp-lab{display:block;font-size:12px;font-weight:600;margin-top:12px}.socp-ta,.socp-dt{display:block;width:100%;box-sizing:border-box;margin-top:6px;font-family:inherit;font-size:13px;line-height:1.45;padding:8px 10px;border-radius:8px;border:1px solid rgba(128,120,108,.4);background:transparent;color:inherit}.socp-link{display:inline-block;margin-top:10px;font-size:12px}`;
  return {
    init(h) { H = h; if (!document.getElementById('socp-css')) { const st = document.createElement('style'); st.id = 'socp-css'; st.textContent = CSS; document.head.appendChild(st); } loadLog(); },
    html, waiting, reload: loadLog
  };
})();
