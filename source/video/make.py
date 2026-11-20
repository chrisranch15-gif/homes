"""Listing film: listing photos -> Runway image-to-video -> one branded film.
Usage: python3 source/video/make.py source/video/shots/<plan>.json   (needs RUNWAYML_API_SECRET)
Plan: model, ratio ("1280:720" or "720:1280"), seconds (clip length), use (seconds of each clip in the cut),
style, cards dir, out, shots[{photo, move, card?, focus?}]. The last shot carries the end card."""
import json, os, sys, time, hashlib, subprocess, base64, urllib.request, urllib.error
API = 'https://api.dev.runwayml.com/v1'
SITE = 'https://homes.ranchpnw.com/photos/'
ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(ROOT, '..', '..'))
COST = {'gen4_turbo': 5, 'gen4.5': 12}

def call(method, path, body=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body else None, headers={
        'Authorization': 'Bearer ' + os.environ['RUNWAYML_API_SECRET'], 'X-Runway-Version': '2024-11-06', 'Content-Type': 'application/json'})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r: return json.loads(r.read() or b'{}')
        except urllib.error.HTTPError as e:
            msg = e.read().decode()[:400]
            if e.code == 429 and attempt < 3: time.sleep(20 * (attempt + 1)); continue
            raise RuntimeError(f'Runway {method} {path} -> {e.code}: {msg}')

def ff(*a): subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *a], check=True)

def prompt_image(plan, shot, work, i):
    w, h = map(int, plan['ratio'].split(':'))
    if w >= h: return SITE + shot['photo']
    # Vertical: crop the photo ourselves around the chosen focus, so the frame is composed, not squeezed.
    src = os.path.join(work, f'src{i}.jpg'); urllib.request.urlretrieve(SITE + shot['photo'], src)
    fx = float(shot.get('focus', 0.5)); dst = os.path.join(work, f'crop{i}.jpg')
    ff('-i', src, '-vf', f"crop=ih*9/16:ih:(iw-ih*9/16)*{fx}:0,scale=720:1280", '-q:v', '3', dst)
    return 'data:image/jpeg;base64,' + base64.b64encode(open(dst, 'rb').read()).decode()

def clip_key(plan, shot):
    k = json.dumps([plan['model'], plan['ratio'], plan['seconds'], shot['photo'], shot['move'], plan['style'], shot.get('focus', 0.5)])
    return hashlib.sha256(k.encode()).hexdigest()[:16]

def clip(plan, shot, i, work):
    dst = os.path.join(work, f'raw{i}.mp4')
    if os.path.exists(dst): return dst
    cache = os.path.join(ROOT, 'clips', clip_key(plan, shot) + '.mp4')
    if os.path.exists(cache):
        import shutil; shutil.copy(cache, dst); print('shot', i, shot['photo'], 'reused (free)', flush=True); return dst
    if os.environ.get('FAKE_RAW'):
        import shutil; shutil.copy(os.path.join(os.environ['FAKE_RAW'], f'raw{i % 5}.mp4'), dst); return dst
    t = call('POST', '/image_to_video', {'model': plan['model'], 'promptImage': prompt_image(plan, shot, work, i),
        'promptText': (shot['move'] + ' ' + plan['style'])[:1000], 'ratio': plan['ratio'], 'duration': plan['seconds']})
    tid = t['id']; print('shot', i, shot['photo'], tid, flush=True)
    for _ in range(150):
        time.sleep(6); s = call('GET', '/tasks/' + tid)
        if s.get('status') == 'SUCCEEDED': break
        if s.get('status') in ('FAILED', 'CANCELLED'): raise RuntimeError(f'shot {i} {shot["photo"]}: {s.get("failure") or s}')
    else: raise RuntimeError(f'shot {i} timed out')
    urllib.request.urlretrieve(s['output'][0], dst)
    if not os.environ.get('FAKE_RAW'):
        os.makedirs(os.path.dirname(cache), exist_ok=True); import shutil; shutil.copy(dst, cache)
    return dst

def main(path):
    plan = json.load(open(path)); out = os.path.join(REPO, plan['out'])
    h = hashlib.sha256(json.dumps(plan, sort_keys=True).encode()).hexdigest()[:12]
    man = out.replace('.mp4', '.json')
    if os.path.exists(man) and json.load(open(man)).get('plan') == h and os.path.exists(out): print('up to date'); return
    work = os.path.join('/tmp', 'film-' + os.path.basename(path) + '-' + h); os.makedirs(work, exist_ok=True)
    rw, rh = map(int, plan['ratio'].split(':')); W, H = (1920, 1080) if rw >= rh else (1080, 1920)
    FPS, XF, USE = 30, 0.7, float(plan.get('use', 4.0))
    shots = plan['shots']; fresh = sum(not os.path.exists(os.path.join(ROOT, 'clips', clip_key(plan, s) + '.mp4')) for s in shots)
    raws = [clip(plan, s, i, work) for i, s in enumerate(shots)]
    norm, dur = [], []
    for i, r in enumerate(raws):
        n = os.path.join(work, f'n{i}.mp4'); last = i == len(raws) - 1
        ff('-i', r, *([] if last else ['-t', str(USE)]), '-vf', f'scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},format=yuv420p', '-an', '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', n)
        norm.append(n); dur.append(float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', n]).decode()))
    starts = [0.0]
    for d in dur[:-1]: starts.append(starts[-1] + d - XF)
    total = starts[-1] + dur[-1]
    inputs, fc, lab = [], [], '0:v'
    for n in norm: inputs += ['-i', n]
    for i in range(1, len(norm)):
        fc.append(f'[{lab}][{i}:v]xfade=transition=fade:duration={XF}:offset={starts[i]:.3f}[x{i}]'); lab = f'x{i}'
    es = starts[-1] + 0.4   # end card: picture eases darker while the card fades in, together
    fc.append(f"[{lab}]eq=brightness='-0.38*clip((t-{es:.2f})/1.4\\,0\\,1)':saturation='1-0.25*clip((t-{es:.2f})/1.4\\,0\\,1)':eval=frame[b0]"); lab = 'b0'
    k = len(norm); cards = os.path.join(ROOT, plan['cards'])
    for i, s in enumerate(shots):
        c = s.get('card')
        if not c: continue
        inputs += ['-loop', '1', '-t', f'{total:.2f}', '-i', os.path.join(cards, c + '.png')]
        st = starts[i]
        if c == 'end': f = f'fade=in:st={es + 0.2:.2f}:d=1.2:alpha=1'
        else:
            a, z = st + (0.5 if i else 0.3), st + dur[i] - XF - 0.2
            f = f'fade=in:st={a:.2f}:d=0.6:alpha=1,fade=out:st={z - 0.5:.2f}:d=0.5:alpha=1'
        fc.append(f'[{k}:v]format=rgba,{f}[c{k}]')
        fc.append(f'[{lab}][c{k}]overlay=x=0:y={int(s.get("card_dy", 0))}:shortest=1[o{k}]'); lab = f'o{k}'; k += 1
    fc.append(f'[{lab}]format=yuv420p[v]')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    ff(*inputs, '-filter_complex', ';'.join(fc), '-map', '[v]', '-r', str(FPS), '-c:v', 'libx264', '-crf', '20', '-preset', 'veryfast', '-movflags', '+faststart', out)
    json.dump({'plan': h, 'model': plan['model'], 'ratio': plan['ratio'], 'shots': len(raws), 'seconds': round(total, 1),
               'new_clips': fresh, 'credits': fresh * plan['seconds'] * COST.get(plan['model'], 12), 'made': time.strftime('%Y-%m-%d %H:%M UTC', time.gmtime())}, open(man, 'w'), indent=1)
    err = out.replace('.mp4', '-error.txt')
    if os.path.exists(err): os.remove(err)
    print('made', out, round(total, 1), 's')

if __name__ == '__main__':
    try: main(sys.argv[1])
    except Exception as e:
        plan = json.load(open(sys.argv[1])); p = os.path.join(REPO, plan['out'].replace('.mp4', '-error.txt'))
        os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'w').write(time.strftime('%Y-%m-%d %H:%M UTC ', time.gmtime()) + str(e)[:2000] + '\n')
        print('ERROR', e); sys.exit(1)
