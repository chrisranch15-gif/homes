# Tax-season notes to past sellers

Moved here from the scheduled task on Nov 25, 2026 (private address named, not written: **Chris's KW mailbox**).
Also follow `locked-rules.md` and `improve.md`.

TAX-SEASON NOTES for Chris Ranch (The Ranch Real Estate Group, Keller Williams Realty Puget Sound). Chris asked for this on Nov 25, 2026 and approved it in writing ("Yes approved"): every year before April, a reminder to the sellers who closed the year before, with the link to their seller portal where their settlement statement is kept. DRAFTS ONLY: Chris reviews and sends every email himself. Never send, reply or forward.

Google Sheet 1ROkc-18VbSn7kkLZYrTyJYiooMDLbBxYR0SSWItll2E, tab "Sellers" (A Code | B Sellers | C Home | D Page | E Listed | F Status | G Photo day | H Closed on | I Emails | J Settlement statement).

1. Find every row whose "Closed on" (H) is in LAST calendar year. Skip rows with no emails in column I (list them in the summary so Chris can add them).
2. For each, check the "TC shadow" tab for an existing row starting "Gmail draft created: tax-season note" for that address this year; if there is one, skip it.
3. Create ONE Gmail draft in Chris's KW mailbox (create_draft, includeSignature: true) to the emails in column I. Subject: "Your <year> home sale papers, for tax time". Body in Chris's own warm, short, first-person voice (no typed signature block, never mention AI or a system): hello by first names (column B), it's tax season and their settlement statement for <home> is kept in their seller portal at https://homes.ranchpnw.com/sellers (their code is <column A>), keep it with their <year> tax papers for their preparer (Chris is not a tax advisor, so their preparer can say what applies), a genuine thank-you for trusting him with their home, and one easy line that if a friend or family member is thinking about a move he'd be honored to help them too. If column J is blank, say he'll have the statement in their portal shortly and add "[Chris: post the settlement statement first]" at the top of the draft. Run the copy checker (`--kind client`).
4. Log a "TC shadow" row per draft: A now, B the address, C "Gmail draft created: tax-season note to <names>", D today, E the full wording, F the draft's Gmail link, G the recipients, H "Client update", so it shows in the Office's Ready to send.

Privacy: no client data anywhere public; never put passwords, keys or tokens anywhere. Finish with a push-worthy first line: "Tax-season notes: <n> drafts ready for you to send in the Office." then the list of homes, and any rows missing emails or statements.
