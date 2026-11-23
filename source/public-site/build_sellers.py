"""Builds the seller portal (sellers.html) for every listing: the template, the shared checklist,
and each home's page, photo, area and share text (keyed by its page, as in the Sellers tab)."""
import glob, json, os
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
API = 'https://script.google.com/macros/s/AKfycbz0ALnuwyuwKaRkr2sGS7N_TPJ3DIXYYRiLP7RiNlBvv5HfQMxfy82jS88ihRab7Duu/exec'
ORIGIN = 'https://homes.ranchpnw.com'
HOMES = {  # 19917 came before the listing files
  '19917': {'url': ORIGIN + '/19917', 'hero': 'photos/front-dusk.jpg', 'area': 'Tehaleh, Bonney Lake', 'price': '$775,000',
            'og': 'photos/og-19917.jpg', 'ogTitle': '19917 145th St E, Bonney Lake, WA 98391 · 5-Bed Tehaleh Home for Sale',
            'caption': 'We just listed our home in Tehaleh! 5 bedrooms, mountain views and trails right outside. Take a look and share with anyone who might love it:',
            'shareTitle': 'Our home in Tehaleh', 'guide': {'url': 'https://gotehaleh.com', 'label': 'the Tehaleh guide at gotehaleh.com', 'short': 'Life in Tehaleh'}}}
for f in sorted(glob.glob(os.path.join(R, 'source/listings/*.json'))):
    L = json.load(open(f)); k = L['key']; price = '${:,.0f}'.format(L['price']) if L.get('price') else ''
    live = os.path.exists(os.path.join(R, k + '.html'))
    hero = f"photos/{k}/{L['hero']}-800.webp" if L.get('hero') else ''
    HOMES[k] = {'url': ORIGIN + '/' + k if live else '', 'hero': hero, 'og': hero, 'area': L.get('area') or L.get('city', ''), 'price': price,
                'ogTitle': f"{L['address']}, {L.get('city', '')}, {L.get('state', 'WA')}" + (f' · {price}' if price else ''),
                'caption': L.get('caption') or f"We just listed our home in {L.get('city', '')}! Take a look and share with anyone who might love it:",
                'shareTitle': f"Our home in {L.get('city', '')}"}
src = os.path.join(R, 'source/public-site/sellers.template.html')
out = open(src).read().replace('__API__', API).replace('__PREP__', open(os.path.join(R, 'source/content/prep.json')).read()).replace('__HOMES__', json.dumps(HOMES, ensure_ascii=False))
open(os.path.join(R, 'sellers.html'), 'w').write(out)
print('sellers.html for', ', '.join(HOMES))
