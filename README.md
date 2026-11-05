# LinkVault

Save and organise links — a Three Strand Labs prototype, built in Google AI Studio with a UI designed in Claude Design.

Live (static, GitHub Pages): https://threestrandlabs.github.io/linkvault/

## How it works

- Sign in with email/password (Firebase Authentication). Each account's links and collections are stored in **Firestore**, synced in real time, and cached on-device for offline use (Firestore's persistent local cache).
- The optional metadata server (`server.ts`, Express) is **not** available on GitHub Pages. Without it, the app falls back to its built-in on-device category engine and uses the domain as the title.
- Responsive layout: a phone-style single-column app under 1024px wide, and a sidebar + grid desktop app at 1024px and up.
- Works offline as an installable PWA.

## Firestore structure

```
users/{uid}/links/{linkId}        — one document per saved link (SavedPost)
users/{uid}/collections/{id}      — one document per collection/category (CategoryDef)
```

Tags live inline on each link document (`tags: string[]`). There is no shared/global data — every document lives under the signed-in user's `users/{uid}` path.

### Security rules

Deploy the rules in `firestore.rules` (or paste into Firebase Console > Firestore > Rules) so a user can only read/write their own data:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Environment variables

For local dev, copy `.env.example` to `.env.local` (gitignored) and fill in your Firebase web app config. Production builds get the same names from GitHub Actions repo secrets:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

These are the public Firebase **web app** config values — Firebase access control is enforced by the security rules above, not by hiding this config. They still must not be committed: all `.env*` files except `.env.example` are gitignored, and the key must be restricted by HTTP referrer and API in Google Cloud. See [SECURITY.md](SECURITY.md).

If these vars are missing, the app still builds and runs, but shows a "Firebase is not configured" message instead of the sign-in screen.

Optional: `VITE_API_BASE` points the client at a running metadata server (see below). Leave it unset for the static build.

## Run locally

1. `npm install`
2. Set up a Firebase project (Authentication > Email/Password provider enabled, Firestore in production mode) and copy `.env.example` to `.env.local` with your config.
3. Optional: set `GEMINI_API_KEY` in `.env.local` too if you want the local metadata server to work (never commit it — `.env.local` is gitignored).
4. `npm run dev` (Express + Vite with the metadata API on http://localhost:3000)

To point a static build at a running metadata server, build with `VITE_API_BASE=https://your-server npm run build`.

## Deploy

1. `firebase deploy --only firestore:rules` (or paste `firestore.rules` into the console) so user data stays private.
2. Pushing to `main` runs `.github/workflows/deploy.yml`, which builds `dist/` (base `/linkvault/`) with the `VITE_FIREBASE_*` repo secrets and deploys it with GitHub Pages actions. Settings > Pages > Source must be set to **GitHub Actions**.
3. Never commit `dist/` or publish it to a branch by hand.
