PWA Update & Deployment Guidance

This document explains how the HOMMA PWA updates are delivered, how to deploy so clients receive updates reliably, and the available options to force or prompt updates for users who keep the app open.

Summary
- The app uses Angular Service Worker (`ngsw-worker.js`). Built assets are content-hashed; the service worker controls when a new version is activated.
- `src/app/services/update.service.ts` subscribes to Angular's `SwUpdate.versionUpdates` and shows a bottom toast when a new version is ready. Users can choose **Later** or **Update Now**.
- `Update Now` calls `SwUpdate.activateUpdate()` and reloads the page. `Later` keeps the current version running and will prompt again in the next session.
- To avoid interrupting users while they are typing, the prompt is deferred while a form field is focused.

Deployment checklist
1. Update `version` in `package.json` before building.
2. Build a production release:

```bash
npm run build
```

The `prebuild` script writes the package version into `src/assets/update.json`, which is also the runtime version shown on the login page.

3. Ensure you deploy the following root files to your hosting:
- `/index.html`
- `/ngsw.json`
- `/ngsw-worker.js`
- `/manifest.webmanifest`
- `/assets`, other built files

4. Critical caching headers (very important):
- Serve `ngsw-worker.js`, `index.html`, and `manifest.webmanifest` with `Cache-Control: no-cache, max-age=0, must-revalidate` so clients fetch the latest worker and shell quickly.
- Serve hashed asset files with long cache lifetimes (e.g., `Cache-Control: public, max-age=31536000, immutable`).

Why headers matter
- Browsers will revalidate `index.html`, `ngsw-worker.js`, and the manifest only if the server allows revalidation. If these files are cached too aggressively, clients will not notice new versions.

Version control recommendation
- Keep the canonical version in `package.json`. Bump it before running `npm run build`.
- `scripts/generate-update-json.js` is run automatically during `prebuild` and writes `src/assets/update.json`.
- You can also pass an explicit version: `node scripts/generate-update-json.js --version 1.2.3`.
- The login page footer reads this value from `/assets/update.json`.
