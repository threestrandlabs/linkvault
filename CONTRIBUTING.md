# Contributing

## Secrets and deploys (read before your first commit)

See [SECURITY.md](SECURITY.md) for the full rules. In short:

- Never un-ignore `.env*`. Put local values in `.env.local` (gitignored); `.env.example` holds placeholders only.
- Never commit build output (`dist/`). Deploys go through GitHub Actions on push to `main`.
- Paid or privileged keys (e.g. `GEMINI_API_KEY`) stay server-side only and never get a `VITE_` prefix.
- Restrict every Google/Firebase key by HTTP referrer and by API. Firebase web keys are public by design but must still be restricted.
- Install the pre-commit hook so gitleaks checks each commit: `pip install pre-commit && pre-commit install`.
