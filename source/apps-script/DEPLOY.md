# Automatic engine deploys

**Set up and working since Nov 25, 2026** (first automatic deploy: version 18). Every push that changes
`source/apps-script/Code.gs` goes live by itself. If Chris ever signs in again (`clasp login`), replace the
`CLASPRC_JSON` secret with the new `~/.clasprc.json`. Code.gs must stay plain ASCII.

Once this is set up, every change to `Code.gs` goes live on its own through the
GitHub Action `engine-deploy.yml`. No more copy-paste into Apps Script. The engine's
address stays the same (it publishes a new version of the existing deployment).

## One-time setup (Chris, about 10 minutes)

1. **Turn on the Apps Script API** for chrisranch@kw.com:
   https://script.google.com/home/usersettings → "Google Apps Script API" → On.
2. **Script ID**: open the "Ranch Leads · homes.ranchpnw.com" script → Project Settings (gear) →
   IDs → copy **Script ID**. In GitHub: repo → Settings → Secrets and variables → Actions →
   **Variables** tab → New variable `SCRIPT_ID` = that ID. (Not a secret.)
3. **Sign clasp in once** on your Mac (Terminal):
   `npx @google/clasp@2 login` → a browser opens → sign in as chrisranch@kw.com → Allow.
   Then `cat ~/.clasprc.json` and copy everything it prints.
4. In GitHub: same page → **Secrets** tab → New repository secret `CLASPRC_JSON` → paste.
   This is a key to your account: it goes only into GitHub Secrets, never in chat, email or code.
5. Repo → Actions → "Deploy the email engine" → Run workflow. A green check = live.

# Concierge API key (one time)

1. console.anthropic.com → sign in with your business account → Billing: add a card, set a **monthly limit of $25**.
2. API Keys → Create key → name it "Ranch Concierge" → copy it.
3. Apps Script ("Ranch Leads") → Project Settings (gear) → Script Properties → Add property:
   `ANTHROPIC_API_KEY` = the key. Save. (Only here. Never in chat, email or code.)
4. Optional settings in the same place: `AI_DAILY_CAP_CENTS` (default 100 = $1 a day per agent),
   `AI_PROVIDER` (default `anthropic`; another provider is one adapter function in Code.gs).
