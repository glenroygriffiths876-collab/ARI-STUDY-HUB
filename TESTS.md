# v18 MasterClass checks

## Static checks
- Inline JavaScript extracted and validated with `node --check`: PASS
- GitHub/PWA package contains `index.html`, `manifest.webmanifest`, `sw.js`, `.nojekyll`, and 192/512/maskable icons: PASS
- Core lesson text is inline, so teaching content remains available offline after the app shell is cached: PASS

## Chromium runtime checks
The actual HTML/JavaScript was loaded in headless Chromium with `Page.setDocumentContent` because this environment blocks direct localhost/file navigation.

- Home opens correctly: PASS
- 18 subject cards render: PASS
- Geography → Human activity & settlement opens: PASS
- Geography ground-zero card defines **relief**, **settlement**, then **slope** before explaining their relationship: PASS
- Geography examples include southern St. Catherine/Spanish Town and the Blue Mountains: PASS
- Mathematics → Algebra opens and defines **variable**, **term**, and **coefficient** with concrete examples before using them: PASS
- English → Reading & inference opens and defines **literal**, **evidence**, and **inference** with concrete passage examples: PASS
- Master lesson path contains 16 stages: PASS
- Practice stage renders exactly 10 questions: PASS
- Phone-width horizontal overflow in tested paths: 0 px

## Design safeguards
- Flexible answer checking retained; reasonable wording does not require an exact string match.
- Verified video embeds are used only when a stored topic match exists; otherwise the lesson uses an exact-topic search instead of inventing a video ID.
- Wikimedia Commons image enrichment is optional and has an offline/error fallback.
- Mimi receives the current subject, unit, concept and lesson stage when opened from a lesson.
- The 5-step teaching sequence is fully interactive: 1 guided “do one with me” check + 4 independent “your turn” checks: PASS
- Mistake Clinic renders a separate **why this happens** and **how to avoid it** explanation for each tested mistake: PASS
