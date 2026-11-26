# Playbooks: how the Ranch system's agents work, and how they get better

Every recurring agent job reads its instructions from a file in this folder, not from text hidden in a
scheduled task. A scheduled task's own prompt is only: "set up, read CLAUDE.md, locked-rules.md and
improve.md, then follow playbooks/<job>.md", plus a few PRIVATE VALUES (addresses that must never be in
this repo). That way every instruction has a history, a review, and one place to change.

| Job | Playbook | Runs |
|---|---|---|
| Transaction coordinator (shadow mode) | `tc-shadow.md` | 8 AM–6 PM, every 2 hours |
| Listing marketing: pending packages, changes, upgrades, settlement statements | `listing-marketing.md` | hourly 8–6 |
| Social posts for listing moments | `social-posts.md` | hourly 7–9, and on demand from the Office/Desk |
| Seller questions ("Ask Chris" in the portal) | `seller-answers.md` | hourly, 8 AM–7 PM (overnight questions wait for 8 AM) |
| Weekly improvement review | `weekly-review.md` | Mondays, morning |
| Monthly researcher | `researcher.md` | the 2nd of each month |
| Weekly design round | `design-round.md` | Mondays |
| Tax-season notes | `tax-season.md` | Feb 2 every year |
| Nightly town-guide drafts | `town-guides.md` | nightly |

Every job also follows:
- `locked-rules.md`: rules no job and no review may loosen. Only Chris changes them, in his own words.
- `improve.md`: how every job files papercuts, logs Chris's edits, runs the copy checker, keeps quiet hours.

## The loop

1. Jobs do the work and file **papercuts** (Sheet tab "Papercuts") whenever something gets in their way.
2. Chris's **edits** (caption changes before Approve, rewrites of drafts before sending) are saved in "Edits".
3. **Results** come in: post engagement (Metricool), leads and visits, design usage, seller questions and check-ins, deal history.
4. The **weekly review** (`weekly-review.md`) reads all of it and proposes at most 5 changes to these playbooks,
   to `source/voice.md`, or to the portal's "get ahead" notes, in plain words with a real example.
5. Chris taps **Approve / Not quite / I don't understand / Skip** in the Office. Approved changes are tested
   against saved examples (`tests/`) and committed here, with one-tap Undo. The next review reports whether they helped.

Nothing in this loop ever loosens a locked rule, sends anything on its own, or stores client contact details.
