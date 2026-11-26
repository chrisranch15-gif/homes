#!/usr/bin/env python3
"""Marketing assets per listing, for the Desk's gallery.

Finds every asset by its file name (the listing key, e.g. 19917, is in the name), makes a small
thumbnail for each one in marketing/thumbs/, and writes source/app/src/assets.js (const ASSETS)
that the Desk build inlines. ship.sh runs this before building the Desk, so anything a launch
creates shows up in the Desk on the next ship.

Naming the launch uses (keep it, and assets appear on their own):
  <key>.html                                   listing page   (thumb: photos/og-<key>.jpg)
  print/<key>-*brochure.pdf                    brochure
  print/open-house-signs-<key>-<style>.pdf     open house sign-in signs
  social/<key>/*.jpg  (19917: social/*.jpg)    social posts and stories
  social/video/<key>-*.mp4                     listing films
"""
import glob, json, os, re, subprocess, sys

R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SITE = 'https://homes.ranchpnw.com/'
THUMBS = os.path.join(R, 'marketing', 'thumbs')
LEGACY_SOCIAL = {'19917': 'social/*.jpg'}       # the first launch put its social images at the top of social/
os.makedirs(THUMBS, exist_ok=True)
LOOKS = {'editorial': 'Estate Editorial', 'arch': 'Modern Architectural', 'heritage': 'Warm Heritage'}
SIGN_LOOK = {'noir': 'editorial', 'daylight': 'arch', 'heritage': 'heritage'}   # 'gallery' is the retired fourth sign style
PIECES = [('postcard-listed', 'Just Listed postcard'), ('postcard-contract', 'Under contract postcard'), ('postcard-sold', 'Just sold postcard'),
          ('preview-invite', 'Neighbors’ preview invitation'), ('lookbook', 'Lookbook'), ('room-cards', 'Room story cards'), ('talkers', 'Silent talkers'),
          ('flyer', 'Take-one flyer'), ('house-cards', 'House business cards'), ('guide', 'Neighborhood guide booklet'),
          ('shoes', 'Please remove your shoes'), ('bootie-card', 'Shoe covers card'), ('sign-rider', 'QR sign rider (24×6)'), ('window-cling', 'Front window QR'),
          ('thanks-card', 'Thanks for touring card'), ('showing-sheet', 'Showing instructions'), ('offer-sheet', 'Offer instructions'),
          ('upgrades', 'Upgrades sheet'), ('costs', 'Cost of ownership'), ('rules', 'Home rules signs')]
ONSITE = {'shoes', 'bootie-card', 'sign-rider', 'window-cling', 'thanks-card', 'showing-sheet', 'offer-sheet', 'upgrades', 'costs', 'rules', 'room-cards', 'talkers'}

def thumb_pdf(path, name):
    out = os.path.join(THUMBS, name + '.jpg')
    if not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(path):
        subprocess.run(['pdftoppm', '-jpeg', '-r', '40', '-f', '1', '-l', '1', '-singlefile', path, out[:-4]], check=True)
    return 'marketing/thumbs/' + name + '.jpg'

def thumb_video(path, name):
    out = os.path.join(THUMBS, name + '.jpg')
    if not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(path):
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', '3', '-i', path, '-frames:v', '1', '-vf', 'scale=480:-2', '-q:v', '5', out], check=True)
    return 'marketing/thumbs/' + name + '.jpg'

def thumb_img(path, name):
    out = os.path.join(THUMBS, name + '.jpg')
    if not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(path):
        from PIL import Image
        im = Image.open(path).convert('RGB'); im.thumbnail((480, 480)); im.save(out, quality=78)
    return 'marketing/thumbs/' + name + '.jpg'

def nice(s): return re.sub(r'[-_]+', ' ', s).strip().capitalize()

keys = sorted({os.path.basename(p)[:-5] for p in glob.glob(os.path.join(R, '*.html')) if re.match(r'^(\d{3,6}|[a-z]+)\.html$', os.path.basename(p)) and (os.path.exists(os.path.join(R, 'source', 'listings', os.path.basename(p)[:-5] + '.json')) or os.path.exists(os.path.join(R, 'photos', 'og-' + os.path.basename(p)[:-5] + '.jpg')))})
out = {}
for k in keys:
    a = []
    og = 'photos/og-%s.jpg' % k
    if not os.path.exists(os.path.join(R, og)):   # no share image yet: the listing's first photo
        ph = sorted(glob.glob(os.path.join(R, 'photos', k, '*-800.webp')) or glob.glob(os.path.join(R, 'photos', k, '*.webp')) or glob.glob(os.path.join(R, 'photos', k, '*.jpg')))
        og = os.path.relpath(ph[0], R) if ph else og
    og = thumb_img(os.path.join(R, og), 'page-' + k) if os.path.exists(os.path.join(R, og)) else ''
    a.append({'kind': 'Listing page', 't': 'Listing page', 'u': SITE + k, 'th': og})
    for p in sorted(glob.glob(os.path.join(R, 'print', k + '-*brochure.pdf'))):
        a.append({'kind': 'Print', 't': 'Listing brochure', 'u': SITE + 'print/' + os.path.basename(p), 'th': thumb_pdf(p, os.path.basename(p)[:-4])})
    for p in sorted(glob.glob(os.path.join(R, 'print', 'open-house-signs-' + k + '-*.pdf'))):
        style = os.path.basename(p)[:-4].split(k + '-', 1)[1]
        a.append({'kind': 'Print', 't': 'Open house signs', 'u': SITE + 'print/' + os.path.basename(p), 'th': thumb_pdf(p, os.path.basename(p)[:-4]), 'look': SIGN_LOOK.get(style, style), 'pick': 1})
    # launch pieces in all three looks (source/marketing/pieces.py → marketing/<key>/<look>/)
    for look in LOOKS:
        d = os.path.join(R, 'marketing', k, look)
        if not os.path.isdir(d): continue
        for name, label in PIECES:
            p = os.path.join(d, name + '.pdf')
            if os.path.exists(p): a.append({'kind': 'Onsite' if name in ONSITE else 'Print', 't': label, 'u': SITE + os.path.relpath(p, R), 'th': thumb_pdf(p, f'{k}-{look}-{name}'), 'look': look, 'pick': 1})
        ae = os.path.join(d, 'agent-email.html')
        if os.path.exists(ae): a.append({'kind': 'Email', 't': 'Agent-to-agent email', 'u': SITE + os.path.relpath(ae, R), 'th': thumb_img(ae[:-5] + '.jpg', f'{k}-{look}-agent-email'), 'look': look})
        for name, label in [('contract-post', 'Under contract · post'), ('contract-story', 'Under contract · story'), ('contract-square', 'Under contract · square')]:
            p = os.path.join(d, name + '.jpg')
            if os.path.exists(p): a.append({'kind': 'Pending', 't': label, 'u': SITE + os.path.relpath(p, R), 'th': thumb_img(p, f'{k}-{look}-{name}'), 'look': look})
        sl = sorted(glob.glob(os.path.join(d, 'carousel-*.jpg')), key=lambda x: int(re.findall(r'(\d+)\.jpg$', x)[0]))
        for i, p in enumerate(sl, 1): a.append({'kind': 'Carousel', 't': f'Slide {i} of {len(sl)}', 'u': SITE + os.path.relpath(p, R), 'th': thumb_img(p, f'{k}-{look}-carousel-{i}'), 'look': look})
    if glob.glob(os.path.join(R, 'print', 'open-house-signs-' + k + '-*.pdf')):
        a.append({'kind': 'Page', 't': 'Open house sign-in page', 'u': SITE + 'welcome?home=' + k, 'th': og})
    for p in sorted(glob.glob(os.path.join(R, 'social', 'video', k + '-*.mp4'))):
        b = os.path.basename(p)[:-4]
        a.append({'kind': 'Film', 't': nice(b.split(k + '-', 1)[1]) + ' film', 'u': SITE + 'social/video/' + b + '.mp4', 'th': thumb_video(p, b)})
    for p in sorted(glob.glob(os.path.join(R, 'social', k, '*.jpg')) + glob.glob(os.path.join(R, LEGACY_SOCIAL.get(k, '__none__')))):
        rel = os.path.relpath(p, R)
        a.append({'kind': 'Social', 't': nice(os.path.basename(p)[:-4]), 'u': SITE + rel, 'th': thumb_img(p, 'social-' + k + '-' + os.path.basename(p)[:-4])})
    out[k] = a

looks = {k: json.load(open(os.path.join(R, 'marketing', k, 'pieces.json'))).get('look', 'editorial') for k in out if os.path.exists(os.path.join(R, 'marketing', k, 'pieces.json'))}
js = '/* generated by source/marketing/build_assets.py — do not edit by hand */\nconst ASSETS = ' + json.dumps(out, indent=0) + ';\nconst ASSET_LOOK = ' + json.dumps(looks) + ';   // each listing\'s launch look (the Desk toggle can switch it)\n'
open(os.path.join(R, 'source', 'app', 'src', 'assets.js'), 'w').write(js)
print(' · '.join('%s: %d assets' % (k, len(v)) for k, v in out.items()))

# ---------- Office "Sites & pages" gallery: public sites and town guides (source/office/sites.json, injected by ship.sh) ----------
def site_thumb(rel, name):
    p = os.path.join(R, rel)
    return thumb_img(p, 'site-' + name) if os.path.exists(p) else ''
sites = [
    {'g': 'Sites', 't': 'Your homes site', 's': 'Listings, reviews, selling and Unlisted', 'u': SITE, 'th': site_thumb('photos/og-19917.jpg', 'home')},
    {'g': 'Sites', 't': 'Unlisted', 's': 'Off-market buyer program: Inside Track and By Invitation', 'u': SITE + 'unlisted', 'th': site_thumb('marketing/og-unlisted.jpg', 'unlisted')},
    {'g': 'Sites', 't': 'Reviews', 's': 'What clients say', 'u': SITE + 'reviews', 'th': site_thumb('marketing/og-reviews.jpg', 'reviews')},
    {'g': 'Sites', 't': 'Selling with us', 's': 'What happens when we take your listing', 'u': SITE + 'sell', 'th': site_thumb('marketing/og-sell.jpg', 'sell')},
    {'g': 'Sites', 't': 'Seller portal', 's': 'Sellers sign in to follow their sale', 'u': SITE + 'sellers', 'th': site_thumb('marketing/ph-portal-2.webp', 'sellers')},
    {'g': 'Town guides', 't': 'Tehaleh', 's': 'Live at gotehaleh.com', 'u': 'https://gotehaleh.com', 'th': site_thumb('photos/og-tehaleh.jpg', 'tehaleh')},
]
for f in sorted(glob.glob(os.path.join(R, 'source', 'guides', '*.json'))):
    d = json.load(open(f)); slug = d.get('slug') or os.path.basename(f)[:-5]; pub = d.get('status') == 'published'
    ph = 'photos/og-%s.jpg' % slug
    if not os.path.exists(os.path.join(R, ph)) and isinstance(d.get('photos'), dict) and d['photos']:
        ph = list(d['photos'].values())[0][0]
    sites.append({'g': 'Town guides', 't': d.get('name') or nice(slug), 's': 'Live' if pub else 'Draft, waiting for your review',
                  'u': SITE + 'guides/' + slug if pub else d.get('review', ''), 'th': site_thumb(ph, 'guide-' + slug), 'draft': not pub})
open(os.path.join(R, 'source', 'office', 'sites.json'), 'w').write(json.dumps(sites, indent=0))
print('sites: %d (%d guides)' % (len(sites), sum(1 for x in sites if x['g'] == 'Town guides')))

# ---------- Office: pending packages to post (source/office/pending.json, injected by ship.sh) ----------
pend = []
for k, v in out.items():
    pj = os.path.join(R, 'marketing', k, 'pieces.json')
    if not os.path.exists(pj): continue
    meta = json.load(open(pj)); items = [a for a in v if a['kind'] == 'Pending' or (a['kind'] == 'Print' and a['t'] == 'Under contract postcard')]
    if items: pend.append({'key': k, 'address': meta.get('address', k), 'contract': meta.get('contract', ''), 'look': meta.get('look', 'editorial'), 'items': items})
open(os.path.join(R, 'source', 'office', 'pending.json'), 'w').write(json.dumps(pend, indent=0))
print('pending packages:', len(pend))
