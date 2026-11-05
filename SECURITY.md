# Security

## Reporting a vulnerability

Please report security issues privately to threestrandlabs@gmail.com (or via GitHub's "Report a vulnerability" button on this repo) rather than opening a public issue.

## Rules for keys and secrets

1. **Never un-ignore `.env*` files.** `.gitignore` ignores every `.env*` file except `.env.example`, which must only ever contain placeholder values. Do not add `!.env.production` (or any other `!.env…` exception) back.
2. **Never commit build output.** `dist/` and `build/` are gitignored. Deploys to GitHub Pages go through GitHub Actions (`.github/workflows/deploy.yml`), which builds with values from repo secrets. There is no `gh-pages` branch to commit to.
3. **Keep paid keys server-side only.** Keys that cost money or grant privileged access (e.g. `GEMINI_API_KEY`) live only on the server (`server.ts`) or in CI secrets. Never prefix them with `VITE_`: anything named `VITE_*` is inlined into the public JavaScript bundle.
4. **Restrict every Google / Firebase key.** In Google Cloud Console > APIs & Services > Credentials, every key must have:
   - **Application restrictions:** HTTP referrers limited to the real origins (e.g. `https://threestrandlabs.github.io/linkvault/*` and `http://localhost:*` for dev).
   - **API restrictions:** only the APIs the app uses (e.g. Identity Toolkit, Token Service, Cloud Firestore for the Firebase web key).
5. **Firebase web API keys are public by design, but must still be restricted.** The Firebase web config ships in the browser bundle, so it is not a secret; access control comes from Firebase Auth and `firestore.rules`. Restrictions (above) stop the key being abused for other APIs or from other sites, and keeping it out of git keeps secret scanners quiet and lets us rotate it cleanly.

## Secret scanning

- **CI:** `.github/workflows/gitleaks.yml` runs [gitleaks](https://github.com/gitleaks/gitleaks) on every push and pull request.
- **Locally:** `.pre-commit-config.yaml` runs gitleaks before each commit. Set it up once with `pip install pre-commit && pre-commit install`.

If a key is ever committed: restrict or rotate it first (removing it from the latest commit does not remove it from git history), then remove it from the repo.
