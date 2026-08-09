# v17 Clarity First checks

- JavaScript syntax (`node --check`): PASS
- Upload package contains index.html, manifest, service worker, .nojekyll and three icons: PASS
- Lesson player code includes one-stage-at-a-time rendering: PASS
- Lesson stages include Start at zero, Words first, Why, Visual, five guided steps, Worked examples, Jamaica connection, Watch out, Practice, Teach-back and Finish: PASS
- Flexible answer checker from v16 retained: PASS
- Contextual Mimi button retained on every lesson stage: PASS
- Read-this-card control present: PASS
- “Make this simpler” control present: PASS
- Resume-learning strip present: PASS
- Universal topic search present: PASS
- CSS retains `html,body { max-width:100%; overflow-x:hidden; }`: PASS

Browser automation note: this environment blocked local HTTP/file navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`, so I am not claiming a completed headless click-through for v17. The JavaScript syntax and package structure were validated statically.
