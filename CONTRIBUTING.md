# Contributing to Board Game Creator

Thank you for your interest in contributing! This document covers the development workflow and code standards.

## Getting Started

```bash
# Clone the repository
git clone https://github.com/ChessMess/board-game-creator.git
cd board-game-creator

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open **http://localhost:5173** in your browser to verify everything works.

## Development Workflow

1. **Create a branch** from `main` for your changes
2. **Make your changes** following the code standards below
3. **Test locally**:
   - Verify the SVG preview and PDF export work correctly for whichever app(s) you touched (`/rtdt`, `/trv`)
   - Run `npm run test:e2e` — the Playwright suite covers baseline load/render for both apps. If you touched `src/shared/`, run it regardless of which app you were focused on, since shared code affects both.
   - Firebase-backed flows (Gallery, Admin, share/submit) run against the **live production database** — there's no emulator. If your change touches these, test manually and avoid destructive actions (approve/reject/delete) against real community data.
4. **Open a Pull Request** into `main`

### Useful Commands

| Command                | Description                                     |
| ----------------------- | ------------------------------------------------ |
| `npm run dev`           | Start dev server with hot reload                 |
| `npm run build`         | Production build to `dist/`                      |
| `npm run preview`       | Preview the production build                     |
| `npm run test:e2e`      | Run the Playwright end-to-end suite               |
| `npm run test:e2e:ui`   | Run the suite with Playwright's interactive UI    |

## Code Standards

### React / JSX

- Functional components with hooks (no class components)
- Keep component files focused — one component per file
- Use Tailwind CSS v4 utility classes for styling

### Style

- Follow existing naming conventions and file structure
- Keep SVG markup in `src/rtdt/components/HeroBoard.jsx` / `src/trv/components/CrewLeaderBoard.jsx` — dynamic bindings are inline. `hero_board_template.svg` (repo root) is the authoritative design source for RTDT's board; any visual change must be made in both files (see CLAUDE.md's "SVG Template Sync" section).
- State shape is defined in `src/rtdt/data/defaultHero.js` / `src/trv/data/defaultCrewLeader.js`
- **Cross-game logic goes in `src/shared/`, not copy-pasted.** RTDT and TRV each have their own Gallery/Admin/file-IO/Firebase code, but the actual implementation lives once in `src/shared/` behind a small per-app config object (see CLAUDE.md's "Shared architecture" section for the exact pattern). If you're adding a feature to one app that looks like it duplicates something the other app already has, check whether it belongs in `shared/` first.

## Project Architecture

```
src/
├── main.jsx                 — App bootstrap (mounts RouterApp in StrictMode)
├── RouterApp.jsx             — BrowserRouter: / landing, /rtdt, /trv
├── LandingPage.jsx           — Split-screen game selector
├── index.css                 — Global styles (Tailwind import)
├── shared/                   — Cross-game components/hooks/utils (see CLAUDE.md)
├── rtdt/                     — Return to Dark Tower hero board creator
│   ├── App.jsx               — Layout, state management, PDF export
│   ├── components/
│   │   ├── HeroBoard.jsx     — Inline SVG hero board
│   │   └── HeroForm.jsx      — Editor form
│   ├── data/defaultHero.js   — Canonical state shape and defaults
│   └── utils/heroIO.js       — Save/load/import/export + migration
└── trv/                       — Thunder Road: Vendetta crew leader creator
    ├── App.jsx
    ├── components/
    │   ├── CrewLeaderBoard.jsx
    │   └── CrewLeaderForm.jsx
    ├── data/defaultCrewLeader.js
    └── utils/leaderIO.js
```

Key points:

- **No backend** — this is a purely client-side SPA (the community gallery uses Firebase on the free tier, entirely optional — see README's "Firebase Setup")
- **No state library** — plain React `useState`/hooks, one state-owner hook per app (`useHeroState`, `useLeaderState`)
- **PDF export** — RTDT uses `jspdf` + `svg2pdf.js` (vector, live SVG → PDF); TRV rasterizes via canvas instead. These are intentionally different strategies — don't try to unify them.

## Release Process

This project follows [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow) with tagged releases.

### Steps

1. **Create a release branch** from `main`:

   ```bash
   git checkout -b release/vX.Y.Z
   ```

2. **Update version** in `package.json`

3. **Update `CHANGELOG.md`** with the new version's changes

4. **Build and verify**:

   ```bash
   npm run build
   npm run preview
   npm run test:e2e
   ```

5. **Open a Pull Request** from the release branch into `main`

6. **After merge, tag the release**:

   ```bash
   git checkout main && git pull
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

7. **Create a GitHub Release** from the tag with the changelog content as release notes

8. **Delete the release branch**:
   ```bash
   git push origin --delete release/vX.Y.Z
   ```

### Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **Major** (X.0.0) — Breaking changes or significant architectural changes
- **Minor** (0.X.0) — New features, backwards-compatible
- **Patch** (0.0.X) — Bug fixes, backwards-compatible

## Questions?

Open an [issue](https://github.com/ChessMess/board-game-creator/issues) and we'll be happy to help.
