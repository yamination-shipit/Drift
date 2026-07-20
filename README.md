# Drift — PWA package

Four files: `index.html`, `manifest.json`, `sw.js`, `icons/`. This needs to be
served over HTTPS to install as an app — opening index.html directly from
your file system will run the sounds fine but skip the "Add to Home Screen"
/ offline / wake-lock behavior.

## Fastest way to host it (no account needed)
1. Go to https://app.netlify.com/drop
2. Drag the whole `pwa` folder onto the page.
3. It gives you a live https:// URL in a few seconds.

## Or with a GitHub account (free, permanent)
1. Create a new repo, e.g. `drift-app`.
2. Upload these four items to the repo root.
3. Settings → Pages → Deploy from branch → `main` → `/ (root)`.
4. Your app is live at `https://<username>.github.io/drift-app/`.

## Installing it on your phone
- **Android (Chrome)**: open the URL → menu (⋮) → "Add to Home screen" / "Install app".
- **iPhone (Safari)**: open the URL → Share icon → "Add to Home Screen".
Once installed, it opens full-screen with no browser chrome and works offline
after the first load.

## What this does and doesn't fix
- Keeps the screen awake while playing (via the Wake Lock API) and exposes
  play/pause + a title to the lock screen (via the Media Session API) —
  this is what lets audio keep running when the screen locks on most
  Android phones and recent iOS versions.
- It's still a web app, not a native app: iOS in particular can still
  suspend background tabs more aggressively than Android, and there's no
  way to guarantee background behavior from a PWA alone.
- For guaranteed background audio + real push notifications, the next step
  is a native wrapper (Capacitor is the common path from an existing
  web app) — that's a bigger project, not a config change.
