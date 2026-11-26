# Weekly improvement review

Runs Monday mornings. Also follow `locked-rules.md` and `improve.md`.
Google Sheet `1ROkc-18VbSn7kkLZYrTyJYiooMDLbBxYR0SSWItll2E`.

**Who reads this:** Chris. He's not technical. Every item must make sense on a phone in 30 seconds, with a
real example so he can tell the system understood correctly. No jargon (no "prompt", "token", "regex",
"trajectory", "playbook diff"). If an item can't be said plainly, it isn't ready.

## 1. Did last week's changes help?
For each "Improvement review" row with an Applied date and a blank "Did it help?": measure the one thing
it was meant to change, with numbers ("Since the title-email change: you edited 0 of 3 drafts, before it was
3 of 4"). If there have been fewer than 3 chances to see it, write "Too early to tell: <n> so far. I'll keep
watching." and keep it for next week. Never call a verdict on 1–2 examples. If it made things worse, propose
the Undo as an item.

## 2. Gather the week
- **Papercuts** with Status "New" (group the same problem; count +1s).
- **Edits**: what Chris changed before using something (captions, emails, check-ins, portal answers).
- **TC feedback** and the TC shadow "Match?" column (Worse / Missed it).
- **Seller questions**: group by Stage and topic ("3 of the last 4 sellers asked about the appraisal around
  pending day 10"); note answers Chris fixed.
- **Seller check-ins** (scores and words).
- **Results**: Metricool post analytics for posts on the "Social posts" tab (reach, engagement, saves);
  Leads tab (which pages and posts brought leads); Design usage; listing-page visitors if available.
- **Usage**: which Office and Desk sections Chris opened and tapped ("Usage" tab), and sections he hasn't
  opened in 3+ weeks.
- **Deal history**: repeated trouble with the same lender, title company or inspector.
- **Research** rows with Chris's call "Approve" that haven't been built.

## 3. Pick at most 5 improvements, most valuable first
Kinds of change you may propose:
- wording or a step in a playbook (`source/playbooks/*.md`, never `locked-rules.md`);
- a line in `source/voice.md` (how Chris writes, by audience) from a pattern seen at least 3 times;
- a "get ahead" note in the seller portal for a stage where sellers keep asking the same thing
  (title, the stage and day it appears, the text in Chris's voice);
- moving or hiding an Office/Desk section;
- a copy-checker rule (`source/checks/copy_rules.json`);
- a fix for a papercut;
- "What's working" examples for the social copy brief (the best-performing posts, with numbers).
Never propose loosening a locked rule. If a locked rule causes friction, you may say so plainly as
information ("Sellers asked for the lender's number twice; the rule says no, so I said I'd reach out").

Write each as one "Improvement review" row:
- **Week of** (Monday's date) · **#** · **Title** (plain, under 10 words)
- **What happened:** one or two sentences with a real example ("Twice this week the draft to title opened
  'Hi team'. You changed it to the officer's first name both times.")
- **What I'd change:** one sentence.
- **Before** / **After:** the exact words that change (not code). For a layout change: "Open Houses: 3rd → 6th".
- **Where it shows up:** "emails to title and escrow".
- **Test result:** see step 4.
Leave Chris's call, note, Applied, Did it help, Undo blank.

## 4. Test before Chris sees it
For each item, replay it against saved real examples in `source/playbooks/tests/` (and recent real cases
from the Sheet): write what the job would produce with the change and without it, and check that the change
fixes what it should and breaks nothing else (facts still right, locked rules still kept, copy checker clean).
Put a plain line in **Test result**: "Tried on 4 past title emails: all now use the first name; nothing else
changed." If it fails, fix the proposal or drop it.

## 5. Chris's calls (each run, before writing new items)
Read rows from earlier weeks where Chris's call is set:
- **Approve** → make the change (edit the file in the homes repo; for a portal note, add a row to the Sheet's "Portal notes" tab
  (Stage | From day | Title | Text | Active "yes"); for layout, `source/office/layout.json`), run the tests and checks, ship per CLAUDE.md
  rule 19 if Office/Desk/portal files changed, and put "YYYY-MM-DD · <commit short id>" in Applied. Mark the
  related papercuts "Fixed" with the week.
- **Not quite** → read his note; rewrite the proposal for next week's review using it. His note is a lesson:
  record what it taught in the Note column.
- **I don't understand** → rewrite the item for next week: simpler words, a more concrete example, shorter.
  File a papercut against this review ("item <n> wasn't clear: <why>").
- **Skip** → leave it; don't propose the same thing again for 8 weeks unless new evidence is strong.
- **Undo** column set to "Undo" by Chris → `git revert` that commit, ship, write "Undone YYYY-MM-DD".

## 6. Tell Chris
End with a push notification whose first line is: "Your weekly review is ready: <n> improvements, about 3
minutes." Nothing else goes to him. If there is nothing worth proposing, say so in one line and still report
"did it help" results.
