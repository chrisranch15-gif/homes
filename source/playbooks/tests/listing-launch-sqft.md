# listing-launch · square feet when sources disagree

**Rule (Chris, Nov 26, 2026):** "We will use the larger square footage. As long as we source public record on the
MLS listing, you do not need to worry about sourcing the public record or the square footage situation. Just make
sure it's the larger one always."

## Case: 13157 (Nov 2026)
- In: public record 1,579 sq ft; CubiCasa floor plan 1,512 (515 main + 997 upper).
- Expected: `source/listings/13157.json` has `"sqft": 1579` and no `sqft_note`. The page, link card and every piece
  show 1,579 sq ft. No papercut, no "Launch: needs your answer" row about square feet.
- Also right: floor plan larger than public record → use the floor plan number. The rule is "the larger one", whichever source.
- Never: hide square feet, ask Chris which number, use the smaller number, or average them.
- Still applies: price or beds disagreeing is NOT covered by this rule; those stay hidden and go to Chris.
