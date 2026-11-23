"""Bring a listing's photos from a link-shared Google Drive folder onto the site.
Reads source/photos/<listing>.json: {"listing": "11532", "files": [{"id": "...", "name": "07-Living Room.jpg"}, ...]}
Writes photos/<listing>/<slug>.jpg (1600 px), <slug>.webp and <slug>-800.webp, plus photos/<listing>/index.json.
Runs in GitHub Actions (the Drive download needs the open internet)."""
import io, json, os, re, sys, time, urllib.request
from PIL import Image

def slug(name):
    return re.sub(r'[^a-z0-9]+', '-', os.path.splitext(name)[0].lower()).strip('-')

def get(fid):
    url = f'https://drive.usercontent.google.com/download?id={fid}&export=download&confirm=t'
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                data = r.read()
            Image.open(io.BytesIO(data)).verify()
            return data
        except Exception as e:
            print('retry', fid, e); time.sleep(3 * (attempt + 1))
    raise SystemExit(f'Could not download {fid}: is the folder shared "Anyone with the link"?')

def main(plan):
    p = json.load(open(plan)); out = os.path.join('photos', p['listing']); os.makedirs(out, exist_ok=True)
    index = []
    for f in sorted(p['files'], key=lambda x: x['name']):
        s = slug(f['name'])
        im = Image.open(io.BytesIO(get(f['id']))).convert('RGB')
        big = im.copy(); big.thumbnail((1600, 1600)); big.save(os.path.join(out, s + '.jpg'), quality=84, optimize=True, progressive=True)
        big.save(os.path.join(out, s + '.webp'), quality=80)
        small = im.copy(); small.thumbnail((800, 800)); small.save(os.path.join(out, s + '-800.webp'), quality=78)
        index.append({'slug': s, 'title': re.sub(r'^\d+-', '', os.path.splitext(f['name'])[0]), 'w': big.width, 'h': big.height})
        print('saved', s)
    json.dump({'listing': p['listing'], 'credit': p.get('credit', ''), 'photos': index}, open(os.path.join(out, 'index.json'), 'w'), indent=1)

if __name__ == '__main__':
    for plan in sys.argv[1:]: main(plan)
