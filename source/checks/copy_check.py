#!/usr/bin/env python3
"""Copy checker: every client-facing word passes this before it reaches Chris.

    python3 source/checks/copy_check.py --kind portal "Your inspection period ends Tuesday, December 1."
    python3 source/checks/copy_check.py --kind client draft.txt
    echo "text" | python3 source/checks/copy_check.py --kind caption -
    python3 source/checks/copy_check.py --social              # every caption in source/marketing/social/*.json

Kinds: caption, client (emails/texts to clients), pro (title, escrow, lenders, agents), portal, print.
Rules live in source/checks/copy_rules.json (the weekly review can add one, with Chris's approval).
Exit code 1 if anything at level "error" is found; warnings print but don't fail.
"""
import json, os, re, sys, glob

HERE = os.path.dirname(os.path.abspath(__file__))
RULES = json.load(open(os.path.join(HERE, 'copy_rules.json')))

def check(text, kind):
    out = []
    for r in RULES['rules']:
        if r.get('kinds') and kind not in r['kinds']: continue
        fl = re.I if 'i' in r.get('flags', '') else 0
        for m in re.finditer(r['pattern'], text, fl):
            hit = m.group(0)
            if any(a in text[max(0, m.start() - 2):m.end() + 2] or hit in a for a in r.get('allow', [])): continue
            out.append((r['level'], r['id'], hit, r['why']))
    for r in RULES.get('require', []):
        if r.get('kinds') and kind not in r['kinds']: continue
        if not re.search(r['pattern'], text): out.append((r['level'], r['id'], '(missing)', r['why']))
    n = RULES.get('long_sentence_words', 38)
    for s in re.split(r'(?<=[.!?])\s+', text):
        if len(s.split()) > n: out.append(('warn', 'long-sentence', s[:60] + '…', f'Sentences over {n} words are hard to read.'))
    return out

def report(label, items):
    for lvl, rid, hit, why in items: print(f'{lvl.upper():5} {label} · {rid}: "{hit}" · {why}')
    return any(l == 'error' for l, *_ in items)

def main(argv):
    if '--social' in argv:
        bad = False
        for f in sorted(glob.glob(os.path.join(HERE, '..', 'marketing', 'social', '*-*.json'))):
            d = json.load(open(f))
            for p in d.get('posts', []):
                texts = [p.get('caption', '')] + [' '.join(str(s.get(k, '')) for k in ('eyebrow', 'head', 'line', 'line2')) + ' ' + ' '.join(s.get('lines', [])) + ' ' + ' '.join(a + ' ' + b for a, b in s.get('items', [])) for s in p.get('slides', [])]
                for t in texts:
                    bad |= report(f"{os.path.basename(f)} · {p['id']}", check(t, 'caption'))
        print('social copy: ' + ('needs fixes' if bad else 'clean')); return 1 if bad else 0
    kind = argv[argv.index('--kind') + 1] if '--kind' in argv else 'client'
    rest = [a for i, a in enumerate(argv) if a not in ('--kind',) and (i == 0 or argv[i - 1] != '--kind')]
    src = rest[0] if rest else '-'
    text = sys.stdin.read() if src == '-' else (open(src).read() if os.path.exists(src) else src)
    items = check(text, kind)
    bad = report(kind, items)
    if not items: print('clean')
    return 1 if bad else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
