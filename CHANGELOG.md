# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **Playwright End-to-End Suite** — Baseline load/render regression tests for both creators across Chromium, Firefox, and WebKit (`npm run test:e2e`). Firebase-backed flows (Gallery, Admin, share/submit) and the native File System Access API picker remain manual QA — see CLAUDE.md.
- **TRV Copy / Paste** — Thunder Road: Vendetta crew leader creator now supports Copy (clipboard) and Paste (modal), matching the RTDT hero creator's existing feature.
- **TRV Text Shadow** — Crew leader board text now renders with a drop shadow by default (all 17 editable fields), replacing flat solid-fill lettering. Each field's existing style strip (color/bold/italic/size) gained a shadow on/off toggle plus independent shadow color, blur size, and offset controls, so the look can be tuned or disabled per field the same way the other manual overrides work.

### Fixed

- **RTDT "Preview" and "Open in New Tab" Bugs** — Two spots that hand off a hero to a new browser tab (the admin panel's Preview button, and each Recent Heroes entry's "open in new tab" icon) opened the app's landing page instead of the hero board, so the handoff data was never actually loaded. Both now correctly open `/rtdt`.
- **Duplicate Hero Detection** — The duplicate-submission hash used to gate community gallery submissions was comparing virtue fields (`line1`/`line2`) that don't exist on the current data model, so it ignored virtue description text entirely. Two heroes with the same name/stats/virtue names but different descriptions were incorrectly treated as duplicates of each other. The hash now compares the fields that actually exist (`description`/`kingdom`). Note: this changes hash values, so a hero already sitting in the pending queue under the old hash won't match until it clears the 30-day pending-reference expiry.

### Changed

- **Cross-Game Code Unification** — Consolidated 55–95% duplicated logic between the RTDT and TRV creators into `src/shared/`: the Gallery modal/card, Admin panel, Firebase submit/approve/reject core, gallery-share hook, file I/O (save/load/recents/copy/paste) hook, and the IndexedDB recents store. Each app now supplies a small config object to a shared implementation instead of maintaining an independent copy. No behavior changes beyond the fixes and the new TRV Copy/Paste feature noted above.
- **RTDT Export Rasterization** — RTDT's PDF export now uses the same decode-safe, memoized SVG rasterization TRV already used, closing a "first export after refresh is incomplete" race condition most noticeable on WebKit/Safari.

## [3.1.2] - 2026-04-10

### Changed

- **Form Section Renames** — "Banner Action" renamed to "Start of Turn Text", "Board Text" renamed to "Middle of Turn Text". "End of Turn Text" action extracted from "Middle of Turn Text" into its own collapsible section. Icon substitution (`*`, `#`, `^`) now applies to all three turn sections in both form hints and live board rendering.

## [3.1.1] - 2026-03-18

### Changed

- **Shared UI Components** — Extracted sidebar and toolbar components (SidebarHeader, StatusMessage, ZoomControls, SnapshotButton, RecentsList, SidebarToggleButton, DesignerCredit) into `src/shared/` for reuse across both game creators. Eliminated cross-directory imports between RTDT and TRV.

## [3.1.0] - 2026-03-17

### Changed

- **TRV Portrait Chamfered Corners** — Crew leader portrait now clips with chamfered (cut) corners matching the board template art, using an SVG polygon clipPath with 5px bleed to fully cover the underlying frame.
- **TRV Name Letter Spacing** — Tightened letter spacing on the crew leader name for a more compact, stylized look.

## [3.0.0] - 2026-03-17

### Added

- **Thunder Road Vendetta Crew Leader Creator** — Entirely new game creator with custom board template, crew leader data model, form editor, live SVG preview, and PDF export. Accessible at `/trv`.
- **Landing Page** — Split-screen game selector with animated panels, hover effects, and themed typography for choosing between Return to Dark Tower and Thunder Road Vendetta creators.
- **Shared Infrastructure** — Common Firebase core, snapshot hook, and route switching utilities extracted to `src/shared/` for cross-game reuse.
- **Multi-Layer Inline Icons** — Spirit and warrior tokens on the RTDT hero board now use multi-layer inline SVG icons.

### Changed

- **Multi-Game Routing** — Root `/` now shows the landing page game selector; RTDT hero board creator moved to `/rtdt`, TRV crew leader creator at `/trv`.
- **Rebranded to Board Game Creator** — Page title, 404 page, and documentation updated from "RTDT Hero Board Creator" to "Board Game Creator" to reflect multi-game support.
- **Custom Theme Warning** — Switching away from a custom theme using preset arrows or dropdown now shows a confirmation dialog before discarding custom colors.

## [2.8.1] - 2026-03-14

### Added

- **Custom Theme Loss Warning** — Switching away from a custom theme using the preset arrows or dropdown now shows a confirmation dialog before discarding custom colors. Preset-to-preset switching is unaffected.

## [2.8.0] - 2026-03-14

### Added

- **Board Color Theming** — New "Board Theme" section in the editor with 7 preset themes (Orphaned Scion, Relic Hunter, Brutal Warlord, Spymaster, Archwright, Haunted Recluse, Print Friendly), a single base-color picker for quick custom themes, and advanced individual pickers for background, section headers, header text, and flavor text opacity. Theme persists with hero data in localStorage and JSON exports.
- **Themeable Icons** — All game-mechanic icons (battle, move, quest, cleanse, village, sanctuary, citadel, bazaar, banner, reinforce) and associated text labels (skull, skulls, move) are now independently color-themable. Each preset includes a unique theme-derived icon color; custom themes can override via the new "Icon Color" picker in Advanced Colors. Shared heroes carry their icon color through the community gallery.

## [2.6.3] - 2026-03-10

### Changed

- **Hook Code Quality** — Internal refactor of the five custom hooks. No behavior changes.

## [2.7.0] - 2026-03-10

### Changed

- **Multi-Game Routing Prep** — Renamed `src/v2/` to `src/rtdt/` and moved the RTDT hero creator to `/rtdt`. The root `/` now redirects there automatically, preserving existing behavior while laying groundwork for additional game creators (e.g. Thunder Road Vendetta) under their own routes.

## [2.6.2] - 2026-03-09

### Changed

- **Code refactor** — Split `App.jsx` (1327 lines) into four focused hooks: `useHeroState` (hero state + virtue mutations), `useFileIO` (save/load/recents/paste), `useExport` (PDF + PNG snapshot), and `useGallery` (Firebase share + gallery load). No behavior changes.
- **HeroForm refactor** — Extracted a reusable `CollapsibleSection` component (replacing four identical inline toggle patterns) and a `VirtueEditor` component (virtue navigation, editing, drag-to-reorder). No UI changes.
- **HeroBoard constants** — Moved SVG slot coordinates, artwork bounds, and text offsets into `src/v2/utils/boardLayout.js` so future template syncs have one place to audit.

## [2.6.1] - 2026-03-09

### Changed

- **No More Native Browser Dialogs** — Replaced the remaining native `alert()` (PDF export failure) and `prompt()` (legacy filename input) calls with styled custom modals, completing the elimination of all browser-native dialogs from the app.

## [2.6.0] - 2026-03-09

### Added

- **Duplicate Submission Detection** — Sharing a hero that is already pending review or already approved now shows a clear, dismissable error dialog instead of a generic Firebase permission error.
- **Replace Pending Submission** — If a user has a prior pending submission on record, sharing an updated version prompts to replace it (withdrawing the old entry and submitting the new one). Requires updated Firebase security rules.
- **Submission Error Dialog** — Gallery share failures now appear in a modal dialog that must be explicitly dismissed, replacing the auto-disappearing toast that was easy to miss.

### Changed

- **Pending Submission Tracking** — After a successful share, a local reference (hash + hero name + timestamp) is stored in localStorage. Entries auto-expire after 30 days. If the prior submission was already approved or rejected, the stale reference is silently cleared with no prompt.

## [2.5.0] - 2026-03-09

### Added

- **Custom Confirm Dialogs** — All native browser `confirm()` dialogs replaced with styled modals matching the app's dark amber/gray design language. Destructive actions (reset, delete, load-over-unsaved) show a red confirm button; non-destructive actions use amber.
- **Author Info Required for Gallery Share** — Hero name, revision number, and contact info (Author Info section) are now required before a hero can be submitted to the community gallery.

### Changed

- **Modal Style Consistency** — Paste Modal background and border updated to `bg-gray-900 / border-gray-700`, matching Gallery and Admin Panel modals.

## [2.4.4] - 2026-03-09

### Fixed

- **Unsaved Changes Warning on Gallery Load** — Loading a hero from the gallery now prompts for confirmation when there are unsaved changes, preventing accidental data loss. The same guard was also added to the file load and paste-JSON paths for consistency.

## [2.4.3] - 2026-03-09

### Added

- **Share Warning Dialog** — Clicking Share now shows a centered modal listing all hero readiness issues (default name, missing virtues, default virtue names) before attempting submission, so users know exactly what to fix.

### Changed

- **Revision No. Display** — The auto-prepended `v` prefix has been removed from all revision number display locations; the value now renders exactly as entered.

## [2.4.2] - 2026-03-09

### Fixed

- **Submission Error Details** — Gallery share failures now display the specific reason (e.g. validation message, rate-limit countdown, Firebase error) instead of a generic "try again later" prompt.

## [2.4.1] - 2026-03-09

### Fixed

- **Stale File Handle Overwrite** — On Chrome/Edge, loading a hero via gallery, paste, legacy file input, Reset, or new-tab handoff no longer retains the previously cached file handle. Subsequent saves now correctly open the file picker instead of silently overwriting an unrelated hero file.

## [2.4.0] - 2026-03-06

### Added

- **Community Hero Gallery** — Browse heroes shared by the community from within the app. Click **Gallery** in the sidebar to view approved heroes, **View** to load one into the editor, or **Save** to download the JSON file.
- **Share to Gallery** — Click **Share** in the sidebar to submit your hero for community review. Requires Google sign-in. Submissions go through an admin approval process before appearing in the gallery. Duplicate submissions and default/empty heroes are automatically rejected.
- **Admin Moderation Panel** — Hidden admin panel for reviewing, approving, and rejecting hero submissions. Admins can also delete heroes directly from the gallery view. Access is secured via Firebase Authentication with Google sign-in and custom claims.
- **Open in New Tab** — Each Recent Heroes entry now has a small external-link icon below the × button. Clicking it opens the hero in a new browser Tab without affecting the current draft or triggering unsaved-change warnings. The new Tab loads the hero data but is untethered from the original file (first save will prompt a file picker).

### Changed

- **Recent Heroes Row Refactor** — Extracted the Recent Heroes row into a standalone `RecentHeroRow` component with a proper flex layout, replacing the previous absolute-positioning approach.

## [2.3.1] - 2026-03-05

### Fixed

- **Cross-Browser Image Drop** — Dragging an image from another browser window onto the portrait drop zone now works. Previously only local file drops were handled; browser-to-browser drops (which provide a URL instead of a file) are now fetched and loaded automatically.
- **CORS Drop Error Message** — When a cross-origin image cannot be fetched (e.g. hotlink-protected sites), a brief red toast appears: "Could not load image — please save it locally first." The message auto-dismisses after 3.5 seconds.
- **Nested Button HTML Warning** — Fixed invalid HTML where the remove button (×) inside each Recent Heroes entry was nested inside another `<button>`. The outer element is now a `<div role="button">` with keyboard support, eliminating the React hydration warning.

## [2.3.0] - 2026-03-05

### Added

- **Recent Heroes** — A "Recent Heroes" list appears in the sidebar footer showing the last 5 heroes you saved or loaded. Click any entry to reload it directly from the file on disk — including the portrait. Entries show the hero name, author, revision, virtue count, and relative timestamp. Individual entries can be removed with the × button, or clear all at once with the × on the header.
- **Save-to-Same-File** — On Chrome/Edge, the Save Hero button now uses the File System Access API. The first save opens a native OS file picker; subsequent saves write directly to the same file with no prompt. Loading a file also sets it as the active save target.
- **Unsaved Changes Guard** — Loading a recent hero only prompts for confirmation when you have actual unsaved changes. If you just saved, clicking a recent loads immediately with no dialog.

### Fixed

- **Animated GIF Portraits** — Animated GIFs uploaded as portraits now preserve their animation on the board. Previously, the canvas-based image optimization stripped all but the first frame. GIFs now bypass optimization to keep animation intact. If a GIF is too large, the recompress button clearly warns that converting to JPEG will lose animation.

## [2.2.0] - 2026-03-04

### Added

- **Portrait Quality Slider** — A range slider (10–100%) in the Hero Identity section controls JPEG compression quality for new portrait uploads. Defaults to 80%.
- **Recompress Button** — When a portrait is loaded, a "Recompress at X%" button re-encodes it at the current slider value without needing to re-upload. Useful for reducing localStorage size.
- **Portrait Size Estimate** — Live KB estimate shown next to the quality slider when a portrait is loaded.
- **localStorage Usage Warning** — A warning banner appears below the portrait controls when stored data exceeds 3 MB (yellow) or 4.5 MB (red), prompting the user to reduce portrait quality.
- **Drag-to-Reorder Virtues** — The virtue selector is now a row of draggable chips. Drag any chip to reorder virtues; the live preview updates immediately.

## [2.1.0] - 2026-03-04

### Added

- **Snapshot to Clipboard** — Camera icon button in the preview toolbar captures the hero board as a PNG image and copies it to the system clipboard. Falls back to automatic PNG download if clipboard access is unavailable. Hold the button for 3 seconds to copy **and** download the PNG simultaneously. Filename uses the sanitized hero name (e.g. `my-hero.png`). Button is disabled when the back face is showing.

### Changed

- **Virtue Dropdown Selection** — Clicking **+ Add Virtue** now automatically selects the newly created virtue in the editor dropdown.

## [2.0.0] - 2026-03-02

### Added

- **V2 Hero Board Creator** — All-new board creator based on the full 1213×808px hero board template, replacing the smaller 910×606px hero card as the default view. V1 card creator remains accessible at `/v1`.
- **Dynamic Virtue System** — 0–6 freely assignable virtue slots (up from V1's fixed 5). Each virtue has a type selector: **Standard** (description text), **Advantage** (+1 type advantage), or **Champion** (+2 wild advantages with kingdom selection).
- **Dedicated Virtue Artwork** — Three distinct SVG artwork frames (`virtue_standard.svg`, `virtue_advantage.svg`, `virtue_champion.svg`) rendered per-slot based on virtue type, with empty placeholder shapes for unassigned slots.
- **Standard Default & Advantage Default Virtue Types** — Two new virtue frame styles (`virtue_standard_default.svg`, `virtue_advantage_default.svg`) added to the type selector alongside the existing Standard, Advantage, and Champion options.
- **Champion Virtue Type** — Champion virtues display a centered 2-line title ("CHAMPION OF / THE {KINGDOM}" or "CHAMPION / ABILITY" for all-kingdom), with "+2 Wild Advantages in {terrain}" body text. Kingdom options: ALL, NORTH, SOUTH, EAST, WEST.
- **Banner Action** — New editable text field for the hero's banner action (e.g., "Gain 1 potion"), rendered on the board.
- **Hero Portrait** — Drag-and-drop or click-to-upload portrait image with clip-path framing, matching V1's `xMidYMin slice` approach.
- **Collapsible Form Sections** — Each editor section (Hero Identity, Banner Action, Virtues, Author Info) has a clickable header with a ▼/▲ toggle to collapse or expand its contents; section states persist across page reloads via localStorage.
- **Reset Confirmation Dialog** — Clicking the Reset button now warns you if any fields have been changed from their defaults, preventing accidental data loss.
- **PDF Export with Rasterization** — SVG `<image>` references are rasterized to high-res PNG (3× scale) before PDF generation, fixing corruption issues with complex SVG backgrounds in svg2pdf.js.
- **V1 Data Migration** — Automatically migrates V1 hero data from `rtdt-hero` localStorage key to V2 format on first load.

### Changed

- **Versioned Routing** — App now uses react-router-dom with V2 at `/` (default) and V1 preserved at `/v1`.
- **Separate Storage** — V2 uses `rtdt-hero-v2` localStorage key, independent of V1's `rtdt-hero`.
- **Google Fonts** — Added Karma (600, 700) and Aleo (italic) via CDN for accurate board text rendering.
- **Responsive Board Preview** — V2 hero board now automatically scales to fit the viewport; resizing the browser or toggling the sidebar reflows the card instantly. Toolbar (sidebar toggle, flip, zoom) moved to a dedicated row above the card so controls never overlap the preview. Zooming beyond 100% produces scrollbars for panning.
- **Flavor Text Redesign** — Replaced V2's two separate single-line flavor text inputs with a single textarea (120-character max, up from 2×35). The field includes a live character counter. On the board, text auto-wraps across up to three centered italic lines. Existing saves and V1 migrations are handled transparently.
- **Reset Button Styling** — Reset button now has a visible border, rounded corners, and smaller text so it reads as a proper button instead of plain text.

## [1.4.0] - 2026-02-27

### Added

- **Card Flip Preview** — The hero preview card now features a flip effect: click the 'Show Back' button to flip the card and reveal a back side displaying author information, description, and a custom background image. The back layout adapts to only show fields that are filled in, and the flip animation is smooth and consistent. PDF export remains front-only.
- **Collapsible Sidebar** — Toggle button (« / ») in the preview panel collapses and expands the editor sidebar with a smooth slide animation; sidebar state persists across page reloads via localStorage

### Changed

- **Author / Revision Badge** — Badge is now hidden by default; only appears when at least one of author name or revision number is entered (default values cleared)
- **Kingdom Dropdown** — Added a blank "— none —" default option; when no kingdom is selected the champion ability tab on the card reads "CHAMPION ABILITY" instead of "CHAMPION OF THE [KINGDOM]"

## [1.3.1] - 2026-02-26

### Changed

- **Portrait Import** — Hero JSON paste and file import now only accept JPEG, PNG, and GIF portrait images; other formats are silently ignored
- **Portrait Upload** — Portrait file picker restricted to JPEG, PNG, and GIF; SVG and other formats are rejected
- **Import Validation** — Hero data loaded from storage or imported via file/paste now enforces field length limits consistent with the editor

## [1.3.0] - 2026-02-26

### Added

- **Author Info** — New sidebar section to record author name, revision number, contact info, and design notes/description
- **Author / Revision Badge** — Preview panel shows a subtle badge in the top-left corner when author name or revision is set
- **Contact Badge** — Preview panel shows a contact badge in the bottom-left corner with a one-click copy button when contact info is set

### Changed

- **Move Icon** — Replaced placeholder chevron with authentic boot silhouette matching the official RTDT hero board design
- **Portrait Alignment** — Portrait images now align to the top of the frame instead of centering, so faces and heads are visible first
- **Portrait Drag & Drop** — Portrait upload area now accepts drag-and-drop in addition to click-to-browse; you can also drag a new image onto an existing portrait to replace it
- **Zoom Controls** — Tightened button sizing for a more compact feel

## [1.2.0] - 2026-02-25

### Changed

- **Virtue Editor** — Condensed the 5 separate virtue sections into a single unified section with a dropdown selector and ◀ ▶ arrow buttons to cycle between virtues

## [1.1.0] - 2026-02-25

### Added

- **Save / Load Hero** — Save hero data to a JSON file and load it back; filename prompt pre-fills with the hero name
- **Copy / Paste Hero** — Copy hero JSON to clipboard; paste via a modal textarea for easy sharing
- **Portrait Image Optimization** — Uploaded portraits are automatically resized (max 540×740px) and compressed to JPEG at 80% quality, keeping file sizes small without visible quality loss
- **Zoom Controls** — Preview panel now has +/− zoom buttons (25%–300%) with a click-to-reset percentage indicator
- **Status Feedback** — Transient success/error messages for save, load, copy, and paste operations

## [1.0.0] - 2026-02-25

### Added

- **Hero Card Creator SPA** — React 19 + Vite 6 + Tailwind CSS v4 single-page app for designing custom Return to Dark Tower hero boards
- **Live SVG Preview** — Real-time inline SVG rendering of the hero card as you edit
- **PDF Download** — One-click vector PDF export via jspdf + svg2pdf.js
- **Hero Identity** — Editable hero name, starting Warriors, and Spirit values
- **Portrait Upload** — Custom portrait image with SVG clip-path framing
- **Flavor Text** — Two lines of atmospheric flavor text
- **Virtues System** — Up to 5 virtues: virtue 1 with advantage type, virtues 2–5 with name and two description lines
- **Champion Terrain** — Selectable terrain type for champion ability

[3.1.1]: https://github.com/ChessMess/board-game-creator/compare/v3.1.0...v3.1.1
[3.1.0]: https://github.com/ChessMess/board-game-creator/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/ChessMess/board-game-creator/compare/v2.8.1...v3.0.0
[2.8.1]: https://github.com/ChessMess/board-game-creator/compare/v2.8.0...v2.8.1
[2.8.0]: https://github.com/ChessMess/board-game-creator/compare/v2.7.0...v2.8.0
[2.7.0]: https://github.com/ChessMess/board-game-creator/compare/v2.6.2...v2.7.0
[2.6.3]: https://github.com/ChessMess/board-game-creator/compare/v2.6.2...v2.6.3
[2.4.3]: https://github.com/ChessMess/board-game-creator/compare/v2.4.2...v2.4.3
[2.4.2]: https://github.com/ChessMess/board-game-creator/compare/v2.4.1...v2.4.2
[2.4.1]: https://github.com/ChessMess/board-game-creator/compare/v2.4.0...v2.4.1
[2.4.0]: https://github.com/ChessMess/board-game-creator/compare/v2.3.1...v2.4.0
[2.3.0]: https://github.com/ChessMess/board-game-creator/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/ChessMess/board-game-creator/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/ChessMess/board-game-creator/releases/tag/v2.1.0
[2.0.0]: https://github.com/ChessMess/board-game-creator/releases/tag/v2.0.0
[1.4.0]: https://github.com/ChessMess/board-game-creator/releases/tag/v1.4.0
[1.3.1]: https://github.com/ChessMess/board-game-creator/releases/tag/v1.3.1
[1.3.0]: https://github.com/ChessMess/board-game-creator/releases/tag/v1.3.0
[1.2.0]: https://github.com/ChessMess/board-game-creator/releases/tag/v1.2.0
[1.1.0]: https://github.com/ChessMess/board-game-creator/releases/tag/v1.1.0
[1.0.0]: https://github.com/ChessMess/board-game-creator/releases/tag/v1.0.0
