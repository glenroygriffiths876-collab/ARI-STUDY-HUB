# Ariana Study Hub v2 — Validation Report

## Dataset migration audit
```text
subjects=18
units=165
concepts=639
questions=719
unlinked_or_mixed_questions=67
duplicate_ids=0
broken_prerequisite_refs=0
```

The 67 unlinked/mixed questions are retained for review rather than silently forced onto an uncertain concept.

## Static package checks
- Required file structure: PASS
- Manifest JSON/required fields: PASS
- JavaScript syntax (`node --check`): PASS
- No `eval()` in executable app JS: PASS (the only `eval()` text is a comment stating it is not used)
- No inline event handlers in `index.html`: PASS

## Functional engine checks exercised during development
- `3x + 5 = 20` → `x = 5`
- `2(3x + 1) = 14` → `x = 2`
- `(x + 3)/2 = 5` → `x = 7`
- `4x - 3 = 2x + 9` → `x = 6`
- `25% of 800` → `200`
- `share 600 in ratio 2:3` → `240` and `360`
- Idea-based short-answer checking accepts a correct paraphrase for an inference/evidence response.

## Validation boundary
This report does not substitute for teacher review of every lesson, confirmation of Holy Childhood High School’s exact sequence, full cross-browser/device testing, or outcome validation with real learners.
