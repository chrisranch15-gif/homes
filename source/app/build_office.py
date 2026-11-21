"""Build the Desk for office.ranchpnw.com/desk/ (outside Claude).

Same Desk as the claude.ai artifact, plus a small adapter: it signs in with the
office password already saved on this device (same site as the Office) and
talks to Chris's Google engine instead of Claude's connectors.
Run after build.py:  python3 build_office.py /home/claude/office-repo
"""
import os, shutil, sys

out = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/office-repo'
html = open('index.html').read()

head = '''<meta name="robots" content="noindex, nofollow">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Desk">
<meta name="theme-color" content="#1E2327">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="icon" href="/icon-192.png">
'''

adapter = r'''<script>
/* Office adapter: outside claude.ai, the Desk talks to Chris's own Google engine. */
(function () {
  if (window.claude && window.claude.use) return;
  var ENGINE = 'https://script.google.com/macros/s/AKfycbz0ALnuwyuwKaRkr2sGS7N_TPJ3DIXYYRiLP7RiNlBvv5HfQMxfy82jS88ihRab7Duu/exec';
  var key = null; try { key = localStorage.getItem('ranch.officeKey'); } catch (e) {}
  if (!key) { location.replace('/?desk=1'); return; }
  function engine(body) {
    body.type = 'office'; body.key = key;
    return fetch(ENGINE, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j.ok) { if (j.reason === 'locked') { try { localStorage.removeItem('ranch.officeKey'); } catch (e) {} location.replace('/?desk=1'); } throw { message: j.reason || 'Engine error' }; } return j; });
  }
  var mcp = { callTool: function (server, name, input) {
    if (/Metricool|Drive/.test(server)) return Promise.reject({ message: server + ' opens from claude.ai for now.' });
    return engine({ op: 'tool', server: server, name: name, input: input }).then(function (j) { return j.result; });
  } };
  var sample = function () { return Promise.reject({ message: 'Writing help isn’t in the office yet.' }); };
  sample.json = function (prompt) { return engine({ op: 'ai', prompt: prompt }).then(function (j) { return j.result; }); };
  window.claude = { use: function (n) {
    if (n === 'mcp') return Promise.resolve(mcp);
    if (n === 'sample') return engine({ op: 'ping' }).then(function (p) { if (!p.ai) throw 0; return sample; });
    return Promise.reject({ code: 'unavailable' });
  } };
  if (!location.hash) location.hash = '#desk';
  document.addEventListener('DOMContentLoaded', function () {
    var a = document.createElement('a'); a.href = '/'; a.textContent = '← Office'; a.className = 'office-back';
    a.setAttribute('style', 'position:fixed;left:12px;bottom:12px;z-index:50;padding:8px 14px;border-radius:999px;background:#1E2327;color:#F7F5F1;font:500 13px Inter,system-ui,sans-serif;text-decoration:none;box-shadow:0 2px 10px rgba(0,0,0,.18)');
    document.body.appendChild(a);
  });
})();
</script>
'''

html = html.replace('<title>19917 145th St E · Tehaleh</title>', '<title>Desk · 19917 145th St E</title>\n' + head, 1)
i = html.index('<script>')
html = html[:i] + adapter + html[i:]

d = os.path.join(out, 'desk'); os.makedirs(d, exist_ok=True)
open(os.path.join(d, 'index.html'), 'w').write(html)
for sub in ('photos', 'thumbs'):
    src, dst = sub, os.path.join(d, sub)
    os.makedirs(dst, exist_ok=True)
    for f in os.listdir(src):
        if not os.path.exists(os.path.join(dst, f)) or os.path.getsize(os.path.join(dst, f)) != os.path.getsize(os.path.join(src, f)):
            shutil.copy2(os.path.join(src, f), os.path.join(dst, f))
print('desk', len(html))
