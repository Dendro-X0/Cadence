# Cadence: Release Guide

This document describes how to build and publish Web, Desktop (Tauri v2), and Mobile (Tauri v2 Mobile) releases for this monorepo.

- Repo: `Dendro-X0/Cadence`
- Web app: `apps/web/`
- Desktop wrapper (Tauri v2): `apps/desktop/`
- CI Workflows: `.github/workflows/`

## Prerequisites
- Node 20 and npm
- Rust stable (all targets you intend to build)
- For Android: Java 17 + Android SDK/NDK
- For iOS/macOS: Xcode 15+

## Versioning and Changelogs (Changesets)
1. Create changes:
   ```bash
   npm run changeset
   ```
2. Push to `main`. CI opens a Version PR.
3. Merge the Version PR to bump versions and generate changelogs.

## Web (Vercel)
- Project root: `apps/web/`
- Build command: `pnpm build` (configured in `apps/web/vercel.json`)
- Output: `dist`
- SPA rewrites and long-cache headers are configured in `apps/web/vercel.json`.
- PWA: Service worker with offline fallback and an "Update available" toast.

Local:
```bash
npm --workspace apps/web run dev
npm --workspace apps/web run build
```

## Desktop (Tauri v2)
- Config: `apps/desktop/src-tauri/tauri.conf.json`
  - `build.beforeBuildCommand`: `npm --prefix ../../apps/web run build`
  - Updater (Tauri v2 plugin):
    ```json
    {
      "plugins": {
        "updater": {
          "active": true,
          "pubkey": "<YOUR_PUBLIC_KEY>",
          "endpoints": [
            "https://github.com/Dendro-X0/Cadence/releases/latest/download/latest.json"
          ]
        }
      }
    }
    ```

### Desktop Build (dry-run)
Build installers as CI artifacts without creating a GitHub Release.

- Workflow: `.github/workflows/desktop-build-dryrun.yml`
- Trigger: Actions → "Desktop Build (dry-run)" → Run workflow
- Artifacts: `apps/desktop/src-tauri/target/**/bundle/**`

Local build:
```bash
npm install
npm --workspace apps/web run build
npm --workspace apps/desktop run build
```

### Desktop Release (GitHub Releases)
- Workflow: `.github/workflows/desktop-release.yml`
- Action: `tauri-apps/tauri-action@v0`
- Pre-release detection: tags containing `-rc`, `-beta`, or `-alpha` are marked as pre-releases automatically.

Steps:
1. Ensure updater `pubkey` is set in `tauri.conf.json`.
2. Tag a pre-release for testing:
   ```bash
   git tag v0.1.0-rc.0
   git push --tags
   ```
3. Download installers from the pre-release; smoke test.
4. To verify auto-update, cut another RC:
   ```bash
   git tag v0.1.0-rc.1
   git push --tags
   ```
5. Ship stable when ready:
   - Create a final Changeset and merge the Version PR
   - Tag stable:
     ```bash
     git tag v1.0.0
     git push --tags
     ```

## Mobile (Tauri v2 Mobile)
- Workflow: `.github/workflows/mobile-build.yml` (manual)
- Produces Android AAB/APK and iOS xcarchive/IPA as artifacts.
- Signing (uncomment in the workflow and add secrets when ready):
  - Android: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`
  - iOS: `APPLE_TEAM_ID`, `APPLE_API_ISSUER`, `APPLE_API_KEY_ID`, `APPLE_API_KEY`

Local smoke test:
```bash
npm --workspace apps/web run build
npm --workspace apps/desktop run tauri android build
npm --workspace apps/desktop run tauri ios build
```

## Troubleshooting
- pnpm not found on runners:
  - Workflows use npm to avoid pnpm dependencies.
- Tauri v2 updater schema:
  - Place under `plugins.updater` (not root-level `updater`).
- GitHub Pages 404:
  - `deploy-web.yml` is manual-only. Vercel is the primary web host.

## Checklists
- Web:
  - [ ] PWA installable and offline works
  - [ ] Update toast appears on new deploy
- Desktop:
  - [ ] Dry-run build artifacts validate
  - [ ] Updater works across `-rc` tags
- Mobile:
  - [ ] Android/iOS artifacts built
  - [ ] Signing configured before store submission
