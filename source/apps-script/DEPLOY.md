# Automatic engine deploys

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
