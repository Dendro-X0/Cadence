# Cadence Monorepo

Lightweight, offline‑first focus & motivation app for self‑learners and healthy lifestyle routines. Ships as a PWA (web) and a tiny desktop app via Tauri. Monorepo layout with npm workspaces.

## Structure

```
cadence/
├─ apps/
│  ├─ web/          # Vite + TypeScript PWA
│  └─ desktop/      # Tauri wrapper (v2)
├─ packages/
│  ├─ core-domain/  # Domain types, engines (timer, schedule)
│  ├─ storage/      # Repo interfaces + adapters (idb, tauri/sqlite)
│  ├─ templates/    # Built-in templates & DSL
│  ├─ notifications/# Web + Tauri notification adapters
│  └─ ui/           # UI tokens and helpers
└─ tooling/
   └─ configs/      # Shared tsconfig, lint configs
```

## Requirements

- Node.js 18+

## Commands

- `npm run dev:web` – start the PWA dev server
- `npm run build:web` – build the PWA for production
- `npm run preview:web` – preview the PWA production build
- `npm run tauri` – run Tauri commands in `apps/desktop`
- `npm run typecheck` – run type checks across workspaces

## Development

1. Install dependencies at the monorepo root:
   ```bash
   npm install
   ```
2. In one terminal, start the web app:
   ```bash
   npm run dev:web
   ```
3. (Optional) In another terminal, run the desktop wrapper once Tauri is configured:
   ```bash
   npm run tauri -- dev
   ```

## Code Style

- TypeScript with strict types
- One export per file
- Avoid `any`
- Use constants instead of magic numbers
- JSDoc on public classes and methods
