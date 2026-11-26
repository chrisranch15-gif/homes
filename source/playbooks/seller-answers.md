# Seller questions: "Ask Chris" in the seller portal

Also follow `locked-rules.md` (especially 1, 2, 3, 7, 8) and `improve.md`.
Chris unlocked one thing for this job (Nov 25, 2026): factual answers may appear in the seller's portal
without his approval. Everything else goes to him.

Google Sheet `1ROkc-18VbSn7kkLZYrTyJYiooMDLbBxYR0SSWItll2E`, tab **Seller questions**
(A When asked | B Seller code | C Home | D Stage | E Question | F Kind | G Answer | H Answered by |
I Status | J Answered at | K Source of the answer). The portal writes new rows with Status "New";
the portal shows column G to that seller once Status is "Answered" or "Fixed by Chris".

## Each run (hourly, 8 AM–7 PM Pacific)
1. Read the rows with Status "New" or "Held for 8 AM". If it is 8 PM–8 AM Pacific, set any "New" row to
   "Held for 8 AM" and stop: nothing reaches a client overnight. If nothing is waiting, end with "Quiet."
2. Fill D (Stage) from the deal's records: "listed day N", "pending day N", "closing week", "closed".
3. Decide the kind (F):
   - **fact**: answerable only from verified records: the signed contract's dates (closing date, inspection
     period end, earnest money due, review periods), dates the TC logged from the contract or from written
     confirmations ("Seller date:" rows in "TC shadow", newest per step, and the published "Seller timeline").
     Earnest money "deposited" counts only if a row says it was confirmed by escrow in writing.
   - **strategy**: price, offers, negotiation, repairs, credits, "should we", "what do you think", the market,
     timing decisions, anything about the buyer.
   - **contact**: asks for the buyer's, buyer's agent's or lender's name, phone or email, or to talk to them.
   - **other**: anything else, or anything you aren't sure of.
4. **fact** → write the answer in Chris's voice (source/voice.md): short and specific, the date with the
   weekday, and what happens next. Example Chris approved word for word: "Your inspection period ends Tuesday,
   December 1. I'll let you know as soon as we hear back." If the record isn't confirmed yet, answer
   honestly that you're checking: "I'm checking with escrow and will update you here." and make that true:
   log a "TC shadow" row "Check-in ready: escrow · confirm <what> for the seller's question" with the text,
   so Chris sends it, and the TC updates the portal when escrow replies. Put the record you used in K
   (e.g. "Form 21 Specific Term 11", "TC shadow · Seller date: Inspection period ends"). Run the copy checker
   (`--kind portal`). H "auto", I "Answered", J now.
5. **contact** → never give the details (locked rule 3). G: "I'll reach out to them for you and let you know
   what I hear." H "auto", I "For Chris", and log a "TC shadow" row so Chris sees the task.
6. **strategy / other** → don't answer. I "For Chris". The Office shows it in Needs you; Chris's reply goes
   into G and the portal shows it.
7. Never: wiring instructions, legal or tax advice, anything about the buyer, numbers not in the records,
   promises about outcomes. Never email or text the seller: the answer lives in their portal only.
8. Papercuts: if a record you needed was missing or two records disagree, file it (improve.md).
