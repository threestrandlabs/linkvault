# LinkVault

Save and organise links — a Three Strand Labs prototype, built in Google AI Studio with a UI designed in Claude Design.

Live (static, GitHub Pages): https://threestrandlabs.github.io/linkvault/

## How it works on GitHub Pages
- Fully client-side: links, collections and tags are stored in your browser (localStorage), and it works offline as a PWA.
- The optional metadata server (`server.ts`, Express) is **not** available on GitHub Pages. Without it, the app falls back to its built-in on-device category engine and uses the domain as the title.
- No API keys are bundled. `server.ts` reads `GEMINI_API_KEY` from the server environment only; it is never sent to the browser.

## Run locally
1. `npm install`
2. Optional: copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` (never commit it).
3. `npm run dev` (Express + Vite with the metadata API on http://localhost:3000)

To point a static build at a running metadata server, build with `VITE_API_BASE=https://your-server npm run build`.

## Deploy
`npm run build` outputs `dist/` with base `/linkvault/`; publish `dist/` to the `gh-pages` branch.
