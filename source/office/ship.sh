#!/bin/bash
# Ship The Office and The Desk everywhere at once, so every copy always matches.
#   1. homes.ranchpnw.com/office          (this repo, office/index.html)
#   2. office.ranchpnw.com + /desk         (repo chrisranch15-gif/office: the licensable copy)
#   3. Chris's private claude.ai copies    (Office artifact ba66a063…, Desk artifact 6a12fcfd…)
# Usage: bash source/office/ship.sh [path to office repo clone]
# Then: commit + push both repos, and publish /home/claude/hub/index.html and
# /home/claude/app/index.html to the two claude.ai artifacts (the script prints the reminder).
set -e
HOMES=$(cd "$(dirname "$0")/../.." && pwd)
OFFICE=${1:-/home/claude/office}
DESK_URL=https://claude.ai/artifact/E6iKnuAbJ77ML5sArMqhEq
[ -d "$OFFICE/.git" ] || { echo "Clone chrisranch15-gif/office to $OFFICE first"; exit 1; }

# Office: public copies never hold Chris's addresses
sed 's/__MY_EMAILS__/[]/' "$HOMES/source/office/index.html" > "$HOMES/office/index.html"
cp "$HOMES/office/index.html" "$OFFICE/index.html"
# Private claude.ai copy keeps the CALENDARS line it already has (never committed)
if [ -f /home/claude/hub/index.html ]; then
  LINE=$(grep -m1 '^const CALENDARS = ' /home/claude/hub/index.html || true)
  if [ -n "$LINE" ] && [ "$LINE" != 'const CALENDARS = [];' ]; then
    python3 - "$LINE" "$HOMES/source/office/index.html" <<'EOF'
import sys
s = open(sys.argv[2]).read().replace("const CALENDARS = __MY_EMAILS__;", sys.argv[1], 1)
assert '__MY_EMAILS__' not in s
open('/home/claude/hub/index.html', 'w').write(s)
EOF
  else echo "Note: private Office copy needs Chris's CALENDARS line; left unchanged."; fi
fi

# Desk: tests must pass, then build for claude.ai and for office.ranchpnw.com/desk
rm -rf /home/claude/app && mkdir -p /home/claude/app && cp -r "$HOMES/source/app/." /home/claude/app/
cd /home/claude/app
node -e "const LC=require('./src/engine.js');const T=require('./src/tests.js');const r=T.run(LC);const f=r.filter(x=>!x.pass);console.log((r.length-f.length)+'/'+r.length+' tests');if(f.length){console.log(f);process.exit(1)}"
python3 build.py "$DESK_URL" >/dev/null
ln -sfn "$OFFICE/desk/photos" photos; ln -sfn "$OFFICE/desk/thumbs" thumbs
python3 build_office.py "$OFFICE"

echo "Built. Now: commit + push homes and office; publish /home/claude/hub/index.html → Office artifact ba66a063-8ba8-459c-8002-fc0ce149443d and /home/claude/app/index.html → Desk artifact 6a12fcfd-7e65-4e8d-8acd-573532aab862."
