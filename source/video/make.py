"""Listing walkthrough film: listing photos -> Runway image-to-video -> one branded film.
Usage: python3 source/video/make.py source/video/shots/19917.json
Needs RUNWAYML_API_SECRET in the environment. Skips work already done for the same plan."""
import json, os, sys, time, hashlib, subprocess, urllib.request, urllib.error
API = 'https://api.dev.runwayml.com/v1'
SITE = 'https://homes.ranchpnw.com/photos/'
ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(ROOT, '..', '..'))

def call(method, path, body=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body else None, headers={
        'Authorization': 'Bearer ' + os.environ['RUNWAYML_API_SECRET'], 'X-Runway-Version': '2024-11-06', 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=60) as r: return json.loads(r.read() or b'{}')
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'Runway {method} {path} -> {e.code}: {e.read().decode()[:400]}')

def clip(plan, shot, i, work):
    dst = os.path.join(work, f'raw{i}.mp4')
    if os.path.exists(dst): return dst
    if os.environ.get('FAKE_RAW'): import shutil; shutil.copy(os.path.join(os.environ['FAKE_RAW'], f'raw{i}.mp4'), dst); return dst
    prompt = shot['move'] + ' ' + plan['style']
    t = call('POST', '/image_to_video', {'model': plan['model'], 'promptImage': SITE + shot['photo'], 'promptText': prompt[:1000],
                                         'ratio': plan['ratio'], 'duration': plan['seconds']})
    tid = t['id']; print('task', i, tid, flush=True)
    for _ in range(120):
        time.sleep(6); s = call('GET', '/tasks/' + tid)
        if s.get('status') == 'SUCCEEDED': break
        if s.get('status') in ('FAILED', 'CANCELLED'): raise RuntimeError(f'shot {i} {shot["photo"]}: {s.get("failure") or s}')
    else: raise RuntimeError(f'shot {i} timed out')
    urllib.request.urlretrieve(s['output'][0], dst); return dst

def ff(*a): subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *a], check=True)

def main(path):
    plan = json.load(open(path)); out = os.path.join(REPO, plan['out'])
    h = hashlib.sha256(json.dumps(plan, sort_keys=True).encode()).hexdigest()[:12]
    man = out.replace('.mp4', '.json')
    if os.path.exists(man) and json.load(open(man)).get('plan') == h and os.path.exists(out): print('up to date'); return
    work = os.path.join('/tmp', 'film-' + plan['listing'] + '-' + h); os.makedirs(work, exist_ok=True)
    raws = [clip(plan, s, i, work) for i, s in enumerate(plan['shots'])]
    W, H, FPS, XF = 1920, 1080, 30, 0.8
    norm = []
    for i, r in enumerate(raws):
        n = os.path.join(work, f'n{i}.mp4')
        ff('-i', r, '-vf', f'scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},format=yuv420p', '-an', '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', n)
        norm.append(n)
    dur = [float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', n]).decode()) for n in norm]
    title, end = (os.path.join(ROOT, plan['cards'][k]) for k in ('title', 'end'))
    inputs, fc, last, off = [], [], '0:v', 0.0
    for n in norm: inputs += ['-i', n]
    for i in range(1, len(norm)):
        off += dur[i - 1] - XF; lab = f'x{i}'
        fc.append(f'[{last}][{i}:v]xfade=transition=fade:duration={XF}:offset={off:.3f}[{lab}]'); last = lab
    total = off + dur[-1]; k = len(norm)
    inputs += ['-loop', '1', '-t', f'{total:.2f}', '-i', title, '-loop', '1', '-t', f'{total:.2f}', '-i', end]
    fc.append(f'[{k}:v]format=rgba,fade=in:st=0.6:d=0.8:alpha=1,fade=out:st={dur[0]-1.4:.2f}:d=0.7:alpha=1[t]')
    es = total - 3.6
    fc.append(f"[{last}]eq=brightness=-0.32:saturation=0.8:enable='gte(t,{es:.2f})'[base]")
    fc.append(f'[{k+1}:v]format=rgba,fade=in:st={es+0.5:.2f}:d=0.9:alpha=1[e]')
    fc.append('[base][t]overlay=shortest=1[v1];[v1][e]overlay=shortest=1,format=yuv420p[v]')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    ff(*inputs, '-filter_complex', ';'.join(fc), '-map', '[v]', '-r', str(FPS), '-c:v', 'libx264', '-crf', '20', '-preset', 'veryfast', '-movflags', '+faststart', out)
    vert = out.replace('.mp4', '-vertical.mp4')
    ff('-i', out, '-vf', 'crop=ih*9/16:ih,scale=1080:1920', '-c:v', 'libx264', '-crf', '20', '-preset', 'veryfast', '-movflags', '+faststart', vert)
    json.dump({'plan': h, 'model': plan['model'], 'shots': len(raws), 'seconds': round(total, 1),
               'credits': len(raws) * plan['seconds'] * (5 if plan['model'] == 'gen4_turbo' else 12),
               'made': time.strftime('%Y-%m-%d %H:%M UTC', time.gmtime())}, open(man, 'w'), indent=1)
    print('made', out, round(total, 1), 's')

if __name__ == '__main__':
    try: main(sys.argv[1])
    except Exception as e:
        plan = json.load(open(sys.argv[1])); p = os.path.join(REPO, plan['out'].replace('.mp4', '-error.txt'))
        os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'w').write(time.strftime('%Y-%m-%d %H:%M UTC ', time.gmtime()) + str(e)[:2000] + '\n')
        print('ERROR', e); sys.exit(1)
