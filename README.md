# Ariana's Purple Study Buddy — v7

## Main change
Version 7 is designed around **four main destinations only**:
1. Home
2. Subjects
3. Study
4. Mimi

On phones/tablets these appear as a fixed bottom navigation bar, so Ariana does not have to swipe horizontally through menus.

## Subject workflow
Tap a subject once. Its page contains:
- What to learn — full curriculum map
- Teach me — detailed simple lessons and Quick Guides
- Practise — short subject questions
- Ask Mimi — opens Mimi with that subject already selected

## Smart Mimi for every subject
Mimi now has subject-specific tutoring rules:
- Mathematics: solve/calculates, show small steps, check the final answer
- English: instruction word -> evidence -> answer -> explanation
- Science: idea/data/variables -> cause/effect -> science explanation
- Social Studies / History / Geography / Civics: Point -> Explain -> Jamaica/Caribbean Example -> Link
- French / Spanish: meaning -> grammar pattern -> short model sentence -> check agreement/accents
- Information Technology: identify concept -> Input -> Process -> Output
- R&T / PE / Music / Drama / Visual Arts / Career / Religious Education / HFLE: key term -> what it means -> what to do -> example/check

On supported desktop Chrome, Smart Mimi uses the browser's built-in Prompt API / Gemini Nano. The system prompt includes these subject-specific tutor rules. On phones and unsupported browsers, Local Mimi uses the curriculum knowledge base and rule engines.

## Curriculum coverage
The package retains the complete curriculum map built in v6 and adds:
- Geography as a school-subject lens
- History as a school-subject lens

These are explicitly marked as **confirm school sequence** because the Ministry recognizes Geography and History as Social Sciences, but a current public Holy Childhood Grade 8 sequence was not available.

## PWA
This remains an installable PWA:
- manifest + purple icons
- offline app shell
- phone/tablet/laptop layouts
- daily reminder settings
- exact `.ics` calendar backup

Host over HTTPS (for example GitHub Pages) for full installation/service-worker behavior.
