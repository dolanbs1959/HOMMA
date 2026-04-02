PWA Update & Deployment Guidance

This document explains how the HOMMA PWA updates are delivered, how to deploy so clients receive updates reliably, and the available options to force or prompt updates for users who keep the app open.

Summary
- The app uses Angular Service Worker (`ngsw-worker.js`). Built assets are content-hashed; the service worker controls when a new version is activated.
- We added `src/app/services/update.service.ts` which:
  - checks for updates periodically and on focus/visibility change,
  - shows an Ionic toast prompt to users when a new version is ready,
  - can `activateUpdate()`, clear client caches and unregister service workers before reloading (aggressive fallback).

Deployment checklist
1. Build a production release:

```bash
ng build --configuration=production
```

2. Ensure you deploy the following root files to your hosting:
- `/index.html`
- `/ngsw.json`
- `/ngsw-worker.js`
- `/assets`, other built files

3. Critical caching headers (very important):
- Serve `ngsw-worker.js` and `index.html` with `Cache-Control: no-cache, max-age=0, must-revalidate` so clients fetch the latest worker and shell quickly.
- Serve hashed asset files with long cache lifetimes (e.g., `Cache-Control: public, max-age=31536000, immutable`).

Why headers matter
- Browsers will revalidate `index.html` and `ngsw-worker.js` only if the server allows revalidation. If these files are cached too aggressively, clients will not notice new versions.

Server-driven update (quick implementation included)
- The repo includes a simple server-driven mechanism using `src/assets/update.json` which is copied to the production output. The file format is:

```json
{ "version": "2026-04-02T20:00:00Z", "force": false }
```

- Clients poll `/assets/update.json`. When the `version` differs from the last-seen value the client will either show a soft toast prompt (`force:false`) or a mandatory modal that activates the update (`force:true`).

CI/deploy snippet (example)
- In your CI pipeline, after building and uploading the `docs` folder, update `/assets/update.json` with the new deploy timestamp or version. Example shell snippet:

```bash
# after `ng build --configuration=production` and uploading files
NEW_VERSION=$(date -u +%Y-%m-%dT%H:%M:%SZ)
cat > docs/assets/update.json <<EOF
{ "version": "${NEW_VERSION}", "force": false }
EOF
# upload `docs` to your host
```

Set `force` to `true` only for emergency/critical updates where you are prepared for potential cache clearing or forced reload UX.
