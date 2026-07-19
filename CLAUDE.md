# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server at http://localhost:5173
npm run build        # production build → dist/
npm run preview      # preview the production build
npm run test:e2e     # run the Playwright end-to-end suite (starts the dev server automatically)
npm run test:e2e:ui  # same, with Playwright's interactive UI
```

No linter is configured.

## Architecture

The app uses **react-router-dom** with three routes:

- **`/`** — `LandingPage.jsx`, a split-screen game selector.
- **`/rtdt/*`** — Return to Dark Tower Hero **Board** creator (1213×808px).
- **`/trv/*`** — Thunder Road: Vendetta Crew Leader **Board** creator.

Routing shell: `src/RouterApp.jsx` → `BrowserRouter` with `basename={import.meta.env.BASE_URL}`, dispatching to `LandingPage` / `RtdtApp` / `TrvApp`.

### Directory structure

```
src/
  main.jsx           # mounts RouterApp inside StrictMode
  RouterApp.jsx       # BrowserRouter: / landing, /rtdt, /trv
  LandingPage.jsx     # split-screen game selector
  index.css           # shared Tailwind entry
  shared/             # cross-game code (see "Shared architecture" below)
    components/       # GalleryModal, GalleryCard, AdminPanel, RecentRow, ConfirmDialog, ...
    hooks/             # useGallery, useFileIO, useSnapshot, useConfirm, useFontsReady
    utils/             # firebaseCore, galleryApi, recentsStore, filenames, textFit, svgRaster, ...
  rtdt/               # hero board app
    App.jsx           # state owner + layout + PDF export
    components/
      HeroBoard.jsx
      HeroForm.jsx
      VirtueEditor.jsx
      GalleryModal.jsx  # thin config wrapper around shared/components/GalleryModal
      AdminPanel.jsx    # thin config wrapper around shared/components/AdminPanel
    data/
      defaultHero.js    # canonical default state + DEFAULT_HERO_NAME/DEFAULT_VIRTUE_NAMES
      themes.js          # preset themes, source colors, HSL derivation
    hooks/
      useHeroState.js    # hero state + virtue mutations, auto-persist
      useFileIO.js       # thin config wrapper around shared/hooks/useFileIO
      useExport.js       # PDF export (svg2pdf) + PNG snapshot (via shared useSnapshot)
      useGallery.js      # thin config wrapper around shared/hooks/useGallery
    utils/
      heroIO.js          # localStorage, JSON I/O, validation, recents (via shared/utils/recentsStore)
      firebase.js        # thin config wrapper around shared/utils/galleryApi
      svgTheme.js        # runtime SVG color replacement + blob URL generation
  trv/                # crew leader board app — mirrors rtdt's structure
    App.jsx
    components/
      CrewLeaderBoard.jsx
      CrewLeaderForm.jsx
      FieldHandles.jsx    # drag handles for the interactive field editor
      GalleryModal.jsx
      AdminPanel.jsx
    data/
      defaultCrewLeader.js  # DEFAULT_CREW_LEADER_NAME/DEFAULT_EFFECT_NAMES
    hooks/
      useLeaderState.js
      useFileIO.js
      useGallery.js
      useFieldEditor.js   # interactive drag/resize/rotate for board text fields
    utils/
      leaderIO.js
      firebase.js
      fieldRegistry.js    # per-field default position/size/font registry
e2e/                  # Playwright specs (see "Testing" below)
```

### Shared architecture (Firebase-backed features)

RTDT and TRV each have their own Gallery/Admin/Firebase/file-IO/recents code, but the actual logic lives once in `src/shared/` and each app supplies a small config object. Two patterns are used, matching the existing `firebaseCore.js` / `ConfirmDialog.jsx` conventions:

- **Pattern A** (generic component, plain props) — e.g. `shared/components/RecentRow.jsx` takes `title`/`countLabel` computed by the caller.
- **Pattern B** (shared "core" + thin per-app adapter) — the per-app file (e.g. `rtdt/utils/firebase.js`) calls the shared factory with a config object and re-exports the result under its original names, so every existing import path and call site is unchanged:
  - `shared/components/GalleryModal.jsx` / `GalleryCard.jsx` — config: `fetchApproved`/`deleteApproved`/`deleteOwn`/`validateData`/`toJson`/`getName`/`renderMeta`/`renderTag`/`itemLabel`/`shortLabel`.
  - `shared/components/AdminPanel.jsx` — config: `fetchPending`/`approveItem`/`rejectItem`/`validateData`/`getName`/`renderMeta`/`getDescription`/`handoffStorageKey`/`handoffField`/`previewPath`/`itemLabel`/`shortLabel`.
  - `shared/utils/galleryApi.js`'s `createGalleryApi({ entityPath, itemLabel, shortLabel, shortLabelPlural, hashFields, buildPayload, rejectIfDefault, maxPortraitBytes, cooldownMs })` → `{ submit, fetchApproved, fetchPending, approve, reject, deleteApproved, withdrawPending, isPendingHashValid, deleteOwn }`. Each app's `utils/firebase.js` instantiates this and aliases the result to its historical export names (`export const submitHero = api.submit`, etc.).
  - `shared/hooks/useGallery.js` — the share-to-gallery flow (duplicate-pending replacement, load-from-gallery). `getShareIssues` (pre-submit validation) stays 100% app-specific, passed through as config — rtdt's virtue-based checks and trv's slot-based checks share no structure.
  - `shared/hooks/useFileIO.js` — save/load/copy/paste/recents. Config: `toJson`/`validateData`/`loadFromHandle`/`loadRecents`/`addToRecents`/`removeFromRecents`/`clearAllRecents`/`getName`/`defaultName`/`filenameFallback`/`itemLabel`/`getRecentName`/`handoffStorageKey`/`handoffField`/`previewPath`.
  - `shared/utils/recentsStore.js`'s `createRecentsStore({ dbName, maxRecents })` — the IndexedDB layer behind each app's `addToRecents`/`loadRecents`/etc. in `heroIO.js`/`leaderIO.js`.

**`itemLabel` vs `shortLabel`:** several user-facing strings use a long form (rtdt: `"hero"`, trv: `"crew leader"`) and others use a short form (rtdt: `"hero"`, trv: `"leader"`) — this split is intentional and preserves pre-existing wording exactly; `shortLabel` defaults to `itemLabel` when an app doesn't need the distinction (rtdt never does).

Firebase-backed flows (Gallery, Admin, submit/approve/reject) run against the **live production database** — there is no emulator. Test destructive admin actions (approve/reject/delete) only against throwaway submissions, never real community data.

### RTDT details

Uses `hero_board_template.svg` (1213×808px) as the design source. localStorage key: `"rtdt-hero-v2"`.

**Data flow:** `src/rtdt/App.jsx` owns state (via `useHeroState`) and passes `hero` + updater callbacks into `HeroForm` and `HeroBoard`. Save/load/copy/paste/recents go through `useFileIO`; PDF/PNG export through `useExport`; community gallery share/load through `useGallery`.

**SVG Theming:** Board and virtue SVGs are imported as raw strings (`?raw`), themed via `replaceAll` on hex color values, then served as blob URLs. See `src/rtdt/utils/svgTheme.js`. Theme-dependent colors (7 green-family + 2 sentinels) are replaced; theme-independent colors (`#f0e9dc` gold trim, `#ffffff` white, `#231f20` black, `#9a393e` red) are never touched.

**Community Gallery / Admin:** Requires Google sign-in (Firebase). Share validates the hero isn't a default/empty submission, then submits to `heroes/pending/{hash}` for admin approval. See "Shared architecture" above — rtdt's `utils/firebase.js`, `components/GalleryModal.jsx`, and `components/AdminPanel.jsx` are thin config wrappers around the shared implementations.

**Recent Heroes:** Uses IndexedDB (`rtdt-hero-recents` database, via `shared/utils/recentsStore.js`) to store File System Access API file handles for up to 5 recently saved/loaded heroes. Entries include metadata (hero name, author, revision, virtue count) but the actual hero data is read from the file on disk when loaded. Only available in browsers supporting the File System Access API (Chrome/Edge).

**Save-to-Same-File:** On Chrome/Edge, save/load uses `showSaveFilePicker`/`showOpenFilePicker` to get a `FileSystemFileHandle`. The handle is stored in a ref so subsequent saves write directly to the same file. Falls back to legacy download/file-input (with Copy-to-clipboard/Paste-from-JSON as an additional option) on other browsers.

**Compatibility:** `src/rtdt/utils/heroIO.js` still supports importing/migrating legacy V1 JSON data when detected.

## TRV Details

**Reference:** See [TRV_REFERENCE.md](TRV_REFERENCE.md) for comprehensive crew leader board implementation guide.

The Thunder Road Vendetta (TRV) crew leader board app runs at the `/trv` route. Uses the same shared architecture as RTDT (Gallery, Admin, file I/O, recents — see "Shared architecture" above) but with key board/data differences:

- **Static SVG background** — `src/trv/assets/trv_board_bg.svg` is NOT dynamically themed (unlike RTDT's color replacement)
- **Slots-based data model** — 4-slot array sorted by dice value, not fixed named fields
- **Interactive field editor** — `useFieldEditor.js` + `FieldHandles.jsx` support live drag/resize/rotate of board text fields, with per-field overrides stored in `leader.fieldStyles`; `boardLayout.js`/`fieldRegistry.js` hold the default position/size/font per field
- **Theme colors** — Only `accentColor` (dice/title) and `nameColor` (leader name) are customizable
- **Command tokens** — Simple 0–9 counter (not ability-based like RTDT virtues)

localStorage key: `"trv-crew-leader-v2"`. State owner: `src/trv/App.jsx` via `useLeaderState()` hook.

## Testing

Playwright end-to-end suite lives in `e2e/` (`rtdt.spec.js`, `trv.spec.js`, `fixtures/`). Run with `npm run test:e2e` (Playwright's `webServer` config starts/reuses the dev server automatically against `baseURL: "http://localhost:5173"` — routes are requested as full paths, e.g. `new URL("/board-game-creator/rtdt", baseURL)`, since Vite's `base` is `/board-game-creator/`).

**Coverage:** basic load/render smoke tests for both apps across Chromium, Firefox, and WebKit (page loads, root element present, SVG board renders, interactive controls present).

**Explicitly out of scope for automation** — these remain manual QA only:
- File System Access API save/load/recents (Chrome/Edge-only native picker, can't be driven by Playwright). Tests force the legacy fallback via `page.addInitScript(() => { delete window.showOpenFilePicker; delete window.showSaveFilePicker; })`, which is also the real code path Firefox/Safari users hit.
- All Firebase-backed flows (Gallery browse/load/save/delete, Admin sign-in/approve/reject, submit-to-gallery) — live production database, no emulator.

Run `npm run test:e2e` after any change touching shared/rtdt/trv code before considering the change verified.

## Tailwind

Uses Tailwind CSS v4 via `@tailwindcss/vite` plugin. There is **no** `tailwind.config.js` or `postcss.config.js`. The single CSS entry point is `src/index.css` which contains only `@import "tailwindcss"`.

## SVG Template Sync — CRITICAL

### `hero_board_template.svg` ↔ `src/rtdt/components/HeroBoard.jsx`

- The SVG template is the authoritative design source — all visual structure, coordinates, gradients, fonts, and layout live there.
- The React component is the implementation of that template, with hero data bound into SVG elements.
- Any visual change **must be made in both files**. Never update one without the other.
- Do not delete the SVG template — it is the source of truth.

## Key Constraints

- Portrait images are stored as base64 data URLs in state (and localStorage). Large images will bloat localStorage.
- GitHub Pages SPA routing uses `public/404.html` redirect + `index.html` decode script.
- Firebase gallery/auth features require `.env`/`.env.local` values (see README's "Firebase Setup"); the app still builds and runs without them, but gallery/share/admin are disabled.

## Git

Remote: `https://github.com/ChessMess/board-game-creator.git`
