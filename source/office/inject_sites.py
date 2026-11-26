import json, sys
# fills const SITES = __SITES__ in the Office from sites.json (built by source/marketing/build_assets.py)
s = open(sys.argv[1]).read().replace('__SITES__', json.dumps(json.load(open(sys.argv[2]))), 1)
import os
pj = os.path.join(os.path.dirname(sys.argv[2]), 'pending.json')
s = s.replace('__PENDING__', json.dumps(json.load(open(pj)) if os.path.exists(pj) else []), 1)
sj = os.path.join(os.path.dirname(sys.argv[2]), 'social.json')
s = s.replace('__SOCIAL__', json.dumps(json.load(open(sj)) if os.path.exists(sj) else []), 1)
s = s.replace('/*__SOCIAL_UI__*/', open(os.path.join(os.path.dirname(sys.argv[2]), '..', 'app', 'src', 'social.js')).read(), 1)
open(sys.argv[3], 'w').write(s)
