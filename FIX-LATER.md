# Fix Later — Code Review Findings

> From simplify review on 2026-03-16. Items to circle back on.

---

## 1. AppNav link className is copy-pasted

`src/RouterApp.jsx` — both nav links share the exact same Tailwind className string, differing only in the active-check variable.

Extract a helper:
```js
function navLinkClass(isActive) {
  const base = "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors";
  const active = "bg-amber-700 border-amber-600 text-white";
  const inactive = "bg-gray-900/80 border-gray-700 text-gray-400 hover:text-amber-400 hover:border-amber-600";
  return `${base} ${isActive ? active : inactive}`;
}
```

---

## 2. Font family strings stringly-typed throughout CrewLeaderBoard

These strings repeat in multiple style objects:
- `"'Compacta TRV', sans-serif"` — 4 occurrences
- `"'Compacta BT', 'Compacta', sans-serif"` — 3 occurrences
- `"'Acumin Variable Concept', sans-serif"` — 5 occurrences
- `"'BlaxSlabXXL', sans-serif"` — 1 occurrence

Consider a `src/trv/utils/fonts.js` constants file:
```js
export const FONTS = {
  COMPACTA_TRV: "'Compacta TRV', sans-serif",
  COMPACTA_BT: "'Compacta BT', 'Compacta', sans-serif",
  ACUMIN: "'Acumin Variable Concept', sans-serif",
  BLAX_SLAB: "'BlaxSlabXXL', sans-serif",
};
```

---

## 3. Back metadata text elements are repetitive

`src/trv/components/CrewLeaderBoard.jsx` lines 256–341 — four separate inline `<text>` elements for version, author name, contact info, app title, all sharing `fill: '#fff6d3'` and the same null-check pattern.

Consider a small `BackText` helper component similar to `TextBlock`.

---

## Resolved

- ~~`wrapText` duplicated across RTDT and TRV~~ — extracted into `src/shared/utils/textFit.js` during the 2026-07 rtdt/trv unification refactor (see CHANGELOG.md "Cross-Game Code Unification"). Both `HeroBoard.jsx` and `CrewLeaderBoard.jsx` now import the shared implementation.
