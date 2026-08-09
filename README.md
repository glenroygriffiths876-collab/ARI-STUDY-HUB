# Ariana’s Purple Study Hub v2 💜

A modular, offline-first Grade 8 Jamaican learning platform built around an adaptive learning cycle:

**Quick diagnostic → fill missing foundations → learn one idea → worked examples → guided practice → independent practice → mastery check → spaced review**

## Included
- 18 subject areas
- 165 curriculum units in the current project curriculum map
- 639 normalized learning concepts
- 719 migrated practice questions
- adaptive prerequisite diagnostics
- 0–5 concept mastery model
- spaced review scheduling
- idea-based answer checking with numeric/fraction support
- Grade 8 math parser/solver for linear equations and common curriculum calculations
- Mimi tutor with curriculum retrieval, deterministic tutoring/math, and optional Chrome LanguageModel enhancement
- JASDIS-inspired resume, search, progress and review patterns
- mobile-first purple interface
- keyboard/focus accessibility, high contrast, large text and reduced motion
- export/import learner progress
- installable PWA on supported HTTPS hosts such as GitHub Pages
- offline cache for first-party app/content assets
- curriculum/data audit screen

## Curriculum transparency
The application distinguishes between Ministry-supported project curriculum mapping and areas where the exact Holy Childhood High School sequence still needs school confirmation. Concepts that have not received human/teacher content review remain marked `needs-author-review`; the app does not silently label generated copy as teacher-verified.

## GitHub Pages
Upload the contents of this folder to the repository publishing root, then enable GitHub Pages.

## Offline behaviour
The service worker caches the app shell, JavaScript modules, curriculum data and icons. External AI/media are optional enhancements and are not required for core first-party content.

## Progress
Progress is stored locally and can be exported/imported from Settings.

Built with 💜 for Ariana.
