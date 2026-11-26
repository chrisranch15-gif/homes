# The hourly check (dispatcher)

Chris, Nov 26, 2026: "I feel like we're scheduling a lot of tasks. Is there a better way to do this where we don't eat up
usage?" So the watching is done for free by the Google engine (`watch_()` in source/apps-script/Code.gs, every 15 minutes),
which writes a row to the Sheet's **To do** tab only when something happened. This one task does the work, and only then.

To do tab columns: A When | B Job | C Address | D Why | E Ref | F Status | G Done at | H Note.
Status: blank = waiting · "Doing" = a run has it · "Done" · "Waiting: <why>" · "Before the switch" (ignore).

## Each run
0. **The cheap check comes first.** The task's message tells you to read the To do tab before anything else. If no row has
   a blank Status (or "Doing" older than 2 hours, which means a run died) and the message names no job, you have already
   ended with "Quiet." Nothing below happens.
1. Set Status "Doing" on the rows you take. Then attach and clone the repos (homes, plus office when you'll ship) and read
   CLAUDE.md, locked-rules.md, improve.md and voice.md once.
2. Do the jobs in this order (sellers waiting first), each by its own playbook, for the addresses in the rows:
   - **launch** → listing-launch.md. Step 3b (the sellers' photo preview and email draft) first, then the rest.
   - **tc** → tc-shadow.md. One full run covers every waiting tc row (new emails, mutual acceptance, deadline checks,
     Chris's notes). Ignore its "Schedule" section's fixed times: weekends and holidays still mean urgent items and new
     mutual acceptances only.
   - **seller-question** → seller-answers.md. Quiet hours hold: 8 PM to 8 AM Pacific, leave the row blank for the next run.
   - **social** → social-posts.md, for that listing and moment (Under contract, Sold, Just listed).
   - **marketing** → listing-marketing.md: "Pending package" = JOB 1, a change = JOB 2, "Sellers saved upgrades" = JOB 3,
     "Find the settlement statement" = JOB 4.
3. When a job is finished set Status "Done", G the time, H one plain line of what you did. If it can't finish yet
   (photos not downloadable, a statement not arrived), set "Waiting: <why>" and leave it; the engine adds a fresh row
   when something changes. Never leave a row on "Doing".
4. Ship once at the end if anything changed the Office or the Desk (CLAUDE.md rule 19).
5. Same rules as always: drafts only, nothing posted or sent, quiet hours for anything that reaches a client, papercuts
   for anything that slowed you down. End with one short line per job done; Chris gets a phone notice only for the events
   he asked for (mutual acceptance, inspection responses, real problems, photos in).
