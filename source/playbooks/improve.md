# How every job helps the system improve

Every job (scheduled task, the Concierge, any build session) does these four things.
Google Sheet: `1ROkc-18VbSn7kkLZYrTyJYiooMDLbBxYR0SSWItll2E`.

## 1. File a papercut whenever something gets in your way

Append a row to the **Papercuts** tab the moment something wastes effort, fails, or seems wrong:
a tool rejects a value, a tab is missing a column, data disagrees between two places, a step in a playbook is
unclear, a photo folder is named differently, an answer couldn't be found, you had to guess.

Columns: When | Filed by (the job's name) | Where (task / page / tab) | Trying to | Expected | What happened |
What would fix it | Status = "New" | Review week (blank) | Note.

- One plain sentence per column. Specific: "Seller timeline had no Closing day row for 19917", not "data issue".
- Never put client names, emails, phone numbers, deal numbers or email text in a papercut. Use the street
  number ("19917") and the kind of thing ("closing date").
- Before filing, check the last 30 papercuts: if the same thing is already filed and not fixed, add
  "+1 <date>" to its Note instead of a new row.
- Then keep going with whatever you can still do. A papercut never replaces doing the job.

## 2. Save Chris's edits

When you learn that Chris changed something the system wrote before he used it (a caption before Approve,
a Gmail draft he reworded before sending, a portal answer he fixed), append to **Edits**:
When | Where | Kind | Audience | Before | After | Listing (street number) | Note.
Strip client names, emails and numbers from Before/After (write "[name]", "[amount]").

## 3. Check every client-facing word before it reaches Chris

Run `python3 source/checks/copy_check.py --kind <caption|client|pro|portal|print> <file or ->` on any
client-facing text you write (captions, emails, check-ins, portal answers). Fix everything it flags
before saving. If you believe a flag is wrong, keep the text, and file a papercut against the checker.

## 4. Quiet hours and "Quiet."

Nothing reaches a client between 8 PM and 8 AM Pacific. If your run finds nothing to do, end at once with the
single line "Quiet." Don't spend time re-reading everything to be sure: the next run will catch it.

## 5. Keep a quiet trail (never shown unless asked)
When you write a client-facing piece, record in one short line which parts of the brain, the voice guide and the
playbook shaped it (e.g. "brain §5 just-imagine · brain §2b proof-not-praise · voice: pros short"). Social posts: the
post's "trail" field in its JSON. Chris never sees the trail in the Office or the Desk; it exists only so that when
he taps "This feels off", the weekly review can find the cause. Never add sourcing, footnotes or "why" notes to
anything Chris reads or approves.
