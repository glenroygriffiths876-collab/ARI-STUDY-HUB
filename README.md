# Ariana's Purple Study Buddy — PWA v5

## What this package is
This is a Progressive Web App (PWA), not just one HTML file. That is what allows Chrome to install it with its own icon, open it as an app, cache it for offline use, and support service-worker notification features.

## Files
- `index.html` — the complete study app
- `manifest.webmanifest` — app name, icon, theme and install settings
- `sw.js` — offline caching and best-effort background reminder support
- `icons/` — 192px, 512px and maskable purple app icons

## How to test locally
Opening `index.html` directly will let you preview most of the app, but Chrome cannot install a PWA or register its service worker from `file://`.

For a local test, run a small web server in this folder, for example:
`python -m http.server 8000`
Then open `http://localhost:8000`.

## How to install on Ariana's phone/tablet/laptop
Host the contents of this folder on an HTTPS website such as GitHub Pages.
Then open the site in Chrome and choose **Install app** / **Add to Home screen**.
The purple Ariana icon will be used for the installed app.

## Daily reminder behavior
- The app can show the reminder at the selected time while it is open.
- On Chrome versions/devices that allow Periodic Background Sync for installed PWAs, the service worker registers a once-per-day best-effort background check.
- Chrome controls the exact time that Periodic Background Sync wakes, so it is not guaranteed to fire at the exact selected minute when the app is closed.
- Use **Download exact calendar backup** in the Study tab if an exact daily time is important. The generated `.ics` file contains a recurring daily calendar event and display alarm.

## Photo helper
The photo OCR feature loads Tesseract.js from the internet when needed. The rest of the core app is local/offline after the PWA cache is installed.

## Important curriculum note
The app contains a broad Grade 8 curriculum map using Jamaican Ministry sources. French is explicitly listed by the Ministry as a language curriculum area, but a current public Grade 8 French NSC guide was not located during this build. French is therefore marked **Confirm school sequence** rather than falsely claiming an exact Holy Childhood term-by-term sequence.
