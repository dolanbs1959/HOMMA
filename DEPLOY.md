# Deploy guide — secure Quickbase API key and staged deploy

This document shows the recommended steps to securely configure the Quickbase API key for Firebase Functions and deploy to a staging/canary environment before production.

1) Local verification (already done)

- We confirmed the Functions emulator and frontend flows locally using an environment-provided `QUICKBASE_API_KEY`.
- Ensure you have deleted any `functions/.runtimeconfig.json` files containing secrets.

2) Preferred: inject secret via CI using `firebase functions:config:set` or `firebase functions:secrets:set`

- Using `firebase functions:config` (quick, works with existing code that falls back to `functions.config()`):

```bash
# Log in locally (interactive) or use CI with FIREBASE_TOKEN
firebase login:ci

# Set project and secret (replace <PROJECT_ID> and paste the key when prompted)
firebase functions:config:set quickbase.apikey="<YOUR_QUICKBASE_KEY>" quickbase.realm="bobfaulk.quickbase.com" --project <PROJECT_ID>

# Deploy functions to staging
firebase deploy --only functions --project <PROJECT_ID>
```

- Using Firebase Secrets (Secret Manager) and `functions:secrets:set` (recommended for production):

```bash
# Set secret from stdin (CI friendly)
printf "%s" "$QUICKBASE_API_KEY" | firebase functions:secrets:set QUICKBASE_API_KEY --project <PROJECT_ID>

# Deploy (Functions can read secrets via environment variables if set in runtime)
firebase deploy --only functions --project <PROJECT_ID>
```

Notes:
- `index.js` already honors `process.env.*` and will fallback to `functions.config().quickbase` when available.
- Do NOT commit the key to source or to any checked-in config file.

3) CI/CD (GitHub Actions) example — set secrets `FIREBASE_TOKEN` and `QUICKBASE_API_KEY` in your repository settings.

Create `.github/workflows/deploy-staging.yml` (example below): the workflow will inject the Quickbase key into the staging project and deploy functions.

```yaml
name: Deploy functions to staging

on:
  workflow_dispatch:

env:
  FIREBASE_PROJECT: <STAGING_PROJECT_ID>

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install firebase-tools
        run: npm install -g firebase-tools
      - name: Configure Firebase token
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
        run: |
          echo "Using FIREBASE_TOKEN"
      - name: Set Quickbase secret (CI)
        env:
          QUICKBASE_API_KEY: ${{ secrets.QUICKBASE_API_KEY }}
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
          FIREBASE_PROJECT: ${{ env.FIREBASE_PROJECT }}
        run: |
          # Use stdin to avoid the key appearing in logs
          printf "%s" "$QUICKBASE_API_KEY" | firebase functions:secrets:set QUICKBASE_API_KEY --project "$FIREBASE_PROJECT"
      - name: Deploy functions to staging
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
          FIREBASE_PROJECT: ${{ env.FIREBASE_PROJECT }}
        run: |
          firebase deploy --only functions --project "$FIREBASE_PROJECT"
```

4) Post-deploy validation

- Deploy to a staging/canary project and run the same user flows. Monitor logs with:

```bash
firebase functions:log --project <PROJECT_ID>
```

- If you see Quickbase 503s (Formula Query Execution took too long), consider these mitigations:
  - Add additional retries and backoff (already added to `quickbaseProxy`).
  - Implement circuit-breaker / rate limiting for heavy queries.
  - Review Quickbase formula queries and indices to optimize execution time.

5) Rollback plan

- If the new function causes widespread errors, rollback by deploying the previous functions version or disabling the function via the Firebase Console.

6) Final notes

- I will not run any of the above commands using your token — supply the token in CI secrets (`QUICKBASE_API_KEY`) or run the `firebase functions:config:set` command yourself locally when ready.
