import json, sys
# fills const SITES = __SITES__ in the Office from sites.json (built by source/marketing/build_assets.py)
s = open(sys.argv[1]).read().replace('__SITES__', json.dumps(json.load(open(sys.argv[2]))), 1)
open(sys.argv[3], 'w').write(s)
