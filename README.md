# Ariana's Purple Study Hub — v8

This version fixes the Version 7 startup/runtime error that prevented buttons from working.

## Main navigation
- Home
- Subjects
- Study
- Mimi

## Important fix
The app state is now initialized before any UI logic runs. Version 8 was tested in Chromium by clicking through the main navigation, opening a subject, opening Teach Me, opening Mimi, and opening Settings.

## Install
Host this folder over HTTPS for full PWA install/service-worker features. The installed name is **Ariana's Purple Study Hub**.
