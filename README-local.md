Local development workflow

1. Work from the local copy (recommended):
   - Project path: C:\Projects\HOMMA
   - This avoids OneDrive/sync locks which can block builds.

2. Start dev server:
   ```powershell
   cd C:\Projects\HOMMA
   npm install   # first time only
   npm start
   ```

3. Build for local verification and deploy to docs (safe):
   - Build to `dist` (default local output):
     ```powershell
     npm run build:dist
     ```
   - Mirror `dist` to `docs` (for local preview or GitHub Pages):
     ```powershell
     npm run build:docs
     ```

4. Notes:
   - If you keep a copy in OneDrive, do not run builds against the OneDrive folder. Close that workspace in VS Code before opening the local copy.
   - CI should be used to publish `docs` for deployment where possible.
