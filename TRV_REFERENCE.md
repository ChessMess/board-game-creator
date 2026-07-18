# Thunder Road Vendetta — Crew Leader Board Analysis

> Reference guide for Thunder Road Vendetta crew leader board design and implementation.
> Primary source: Official Choppe Shoppe crew leader boards + `src/trv/assets/trv_board_bg.svg`
> Schema: `src/trv/data/defaultCrewLeader.js` (schemaVersion: 2)

---

## 1. Game Context

**Thunder Road Vendetta** (Restoration Games, 2022) is a car-combat racing game. The **Choppe Shoppe** expansion adds 10 named _Crew Leaders_ — characters who replace the standard command board with a custom one that modifies the four base abilities (REPAIR, NITRO, DRIFT, AIRSTRIKE) in cost, text, or both, plus adds a **unique special ability**.

Each crew leader's command board is a **double-sided punchboard** that physically replaces the generic command board for the player's turn.

Known crew leaders (Choppe Shoppe, 10 total):
| Name | Title |
|------|-------|
| Vince Vamp | The Nitromancer |
| Abigail | The Street Sergeant |
| Asha | The Road Mistriss |
| Ms. Betty | The Tinkerer |
| Bumpo the Clown | The Bumpmeister |
| Wong Lei Kong | The Marksman |
| Cris Crass | The Fastest of the Fast |
| Cruft | The ScrapMerchant |
| Machine Gun Joe Esq. | The Bullet King |
| Madame Boubreaux | The Prophet |

Additional leaders exist: **Em Berco** (Maximum Chrome exclusive), **Proud Mary** (promo).
All crew leader artwork by illustrator **Marie Bergeron**.

---

## 2. Board Structure

Each board is a **single punchboard piece**. The SVG template shows three zones:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  LEFT (x: 0–519)         │  RIGHT (x: 519–1039)     │  OFF-SCREEN (x: 1039+)   │
│  = FRONT (game face)     │  = (secondary side)       │  = BACK (metadata)        │
│  portrait, name, title,  │  die-line shapes,         │  app title, headshot,     │
│  special ability,        │  mask layer               │  version, author info,    │
│  4 effect slots,         │                           │  contact, description     │
│  command tokens          │                           │                           │
└──────────────────────────────────────────────────────────────────────────────────┘
```

The LEFT side contains **all user-editable game content**. The RIGHT side is structural (mask/die-line). The OFF-SCREEN area (x > 1039) holds **back-of-board metadata** similar to the RTDT hero board back.

---

## 3. Front Board (LEFT side, x=0–519) — Guide Positions

All positions below are from user-placed Inkscape guide rectangles in the `position guides` layer.

### Portrait

| Guide            | x     | y    | w     | h     | Center         |
| ---------------- | ----- | ---- | ----- | ----- | -------------- |
| `guide-portrait` | 220.4 | 53.6 | 181.2 | 243.4 | (311.0, 175.3) |

- Crew leader portrait image, clipped to chamfered polygon (45° corner cuts)
- Single image used for both front portrait and back headshot

### Special Ability (top of board, unique per leader)

| Guide                        | x    | y     | w     | h     | Center         |
| ---------------------------- | ---- | ----- | ----- | ----- | -------------- |
| `guide-special-ability-name` | 69.0 | 124.5 | 133.6 | 23.7  | (135.9, 136.3) |
| `guide-special-ability-desc` | 71.2 | 154.6 | 128.8 | 117.4 | (135.6, 213.3) |

- **Ability name** — editable (e.g., "JURY RIGGING", "DARK AFFAIR", "LONG ARM OF THE LAW")
- **Ability description** — rules text, multi-line
- This is NOT always "JURY RIGGING" — it varies per crew leader

### Crew Leader Name

| Guide        | x    | y     | w     | h    | Center         |
| ------------ | ---- | ----- | ----- | ---- | -------------- |
| `guide-name` | 96.6 | 313.4 | 276.0 | 69.3 | (234.5, 348.0) |

- Font: **Compacta TRV**, very large (~74px), italic
- Text color: `#fff6d3` (cream)
- Alignment: centered
- Letter-spacing: `-2px` (horizontal scaleX: 1.45)
- Style: all-caps

### Title / Descriptor

| Guide         | x     | y     | w     | h    | Center         |
| ------------- | ----- | ----- | ----- | ---- | -------------- |
| `guide-title` | 104.2 | 388.0 | 246.3 | 19.0 | (227.4, 397.6) |

- Font: **Compacta BT** bold italic, 17px
- Example values: "THE STREET SERGEANT", "THE FASTEST OF THE FAST"
- Color: Colored by `leader.accentColor` (default: `#00ff00`)

### 2×2 Effect Grid (Slots 1–4)

The lower portion of the front board contains a **2×2 grid of 4 effect slots**. Effect names are NOT fixed to positions — they vary per crew leader, sorted by dice value (lowest → Slot 1, highest → Slot 4).

```
┌─────────────────┬─────────────────┐
│  Slot 1         │  Slot 2         │   ← Row 1 (y ≈ 454–546)
│  Lowest dice    │  Next lowest    │
│  e.g. ANY / 1   │  e.g. 1-3 / 2  │
├─────────────────┼─────────────────┤
│  Slot 3         │  Slot 4         │   ← Row 2 (y ≈ 699–740)
│  Next highest   │  Highest dice   │
│  e.g. 3-5       │  e.g. 6         │
└─────────────────┴─────────────────┘
```

**Slot guide positions:**

| Guide                     | x     | y     | w     | h    | Center         |
| ------------------------- | ----- | ----- | ----- | ---- | -------------- |
| `guide-front-slot-1-dice` | 59.4  | 438.3 | 44.7  | 32.7 | (81.7, 454.6)  |
| `guide-front-slot-2-dice` | 353.0 | 439.2 | 44.8  | 30.8 | (375.4, 454.6) |
| `guide-front-slot-1-name` | 126.5 | 488.8 | 92.4  | 22.4 | (172.7, 500.0) |
| `guide-front-slot-2-name` | 230.6 | 488.8 | 98.7  | 22.3 | (280.0, 500.0) |
| `guide-front-slot-1-desc` | 104.1 | 518.9 | 114.1 | 55.5 | (161.2, 546.7) |
| `guide-front-slot-2-desc` | 231.2 | 519.6 | 114.2 | 54.4 | (288.3, 546.8) |
| `guide-front-slot-3-name` | 104.7 | 592.9 | 114.1 | 22.1 | (161.7, 603.9) |
| `guide-front-slot-4-name` | 232.7 | 592.9 | 114.4 | 22.1 | (289.9, 603.9) |
| `guide-front-slot-3-desc` | 122.9 | 620.3 | 96.2  | 41.0 | (170.9, 640.8) |
| `guide-front-slot-4-desc` | 233.8 | 620.7 | 98.9  | 40.2 | (283.3, 640.8) |
| `guide-front-slot-3-dice` | 59.4  | 683.3 | 44.7  | 32.7 | (81.7, 699.6)  |
| `guide-front-slot-4-dice` | 353.0 | 683.3 | 44.7  | 32.7 | (375.4, 699.6) |

**Slot ordering rule:** Slots are assigned by dice value — **lowest/ANY goes Slot 1**, ascending to **highest in Slot 4**. This position assignment is handled by the user; state stores them in order.

**Possible effect types:** REPAIR, NITRO, DRIFT, AIRSTRIKE, or a **Star (★)** icon for special dice values.

Each slot contains:

1. **Dice value** — Compacta BT bold italic, positioned at slot dice guide, colored by `accentColor`
2. **Effect name** — editable live text, 26px scaled 0.8× horizontally
3. **Description** — rules text, 1–3 lines, Acumin Variable Concept 9px, wraps at ~22 chars/line
4. **Subtitle / Modifier** — optional short condition text (e.g., "ONCE PER ROUND")

### Command Tokens

| Guide                        | x     | y     | w    | h    | Center         |
| ---------------------------- | ----- | ----- | ---- | ---- | -------------- |
| `guide-front-command-tokens` | 200.8 | 725.4 | 21.9 | 21.6 | (211.7, 736.2) |

- Count: **0–9** (single digit)
- Position: bottom center of front board

---

## 4. Back Board (OFF-SCREEN, x > 1039) — Metadata

The back of the board contains metadata about the creator/designer, positioned off-screen in the SVG template. Layout mirrors the RTDT hero board back.

| Guide                           | x      | y     | w     | h     | Center          |
| ------------------------------- | ------ | ----- | ----- | ----- | --------------- |
| `guide-back-app-title`          | 1197.3 | 95.6  | 218.7 | 30.1  | (1306.7, 110.7) |
| `guide-headshot`                | 1261.7 | 133.6 | 89.9  | 78.5  | (1306.7, 172.9) |
| `guide-back-version`            | 1233.1 | 224.2 | 147.0 | 23.0  | (1306.6, 235.7) |
| `guide-back-author-name`        | 1176.1 | 484.5 | 261.1 | 29.7  | (1306.7, 499.4) |
| `guide-back-contact-info`       | 1165.5 | 519.9 | 282.3 | 29.5  | (1306.7, 534.7) |
| `guide-back-author-description` | 1157.9 | 551.6 | 297.3 | 151.1 | (1306.6, 627.2) |

**Back fields:**

- **App title** — application/tool branding
- **Headshot** — small portrait reuse (same image as front)
- **Version** — revision number
- **Author name** — designer credit
- **Contact info** — URL, email, etc.
- **Author description** — multi-line bio/notes

---

## 5. Data Model

### Active Schema (schemaVersion: 2)

```js
export const defaultCrewLeader = {
  schemaVersion: 2,
  crewLeaderName: "", // 30 char max
  crewLeaderTitle: "", // 40 char max
  portraitDataUrl: null, // base64 data URL (JPEG/PNG/WebP)

  // Special ability (top of front board, unique per leader)
  specialAbilityName: "", // 30 char max
  specialAbilityDescription: "", // 300 char max

  // 4 positional effect slots — stored 0-indexed, sorted by dice value (lowest → slot 0)
  // NOTE: there is NO `subtitle` field. dice may be "6", "1-3", "ANY", or "★".
  slots: [
    { effectName: "", dice: "", description: "" }, // Slot 0
    { effectName: "", dice: "", description: "" }, // Slot 1
    { effectName: "", dice: "", description: "" }, // Slot 2
    { effectName: "", dice: "", description: "" }, // Slot 3
  ],

  // Command token count (0-9, single digit)
  commandTokens: 0,

  // Theme colors
  accentColor: "#00ff00", // dice values, title, slot controls
  nameColor: "#fff6d3", // leader name text

  // Back metadata
  author_name: "", // 40 char max
  revision_no: "", // 20 char max
  contact_info: "", // 60 char max
  author_description: "", // 300 char max
};
```

> **★ command-token dice:** the star is a **dice value** (`slot.dice === "★"`), set via the
> ★ toggle next to the Dice Value field. It is not an Effect Name option. The board renders
> it as a filled star polygon (`CrewLeaderBoard.jsx`).

---

## 6. Typography Summary

| Element             | Font                    | Weight | Style  | Size                | Fill          |
| ------------------- | ----------------------- | ------ | ------ | ------------------- | ------------- |
| Crew Leader Name    | Compacta TRV            | 400    | italic | 74px (scaleX: 1.45) | `#fff6d3`     |
| Title/Descriptor    | Compacta BT             | 700    | italic | 17px                | `accentColor` |
| Dice values         | Compacta BT             | 700    | normal | 30px                | `accentColor` |
| Effect name         | Compacta TRV            | 400    | italic | 26px (scaleX: 0.8)  | `#fff6d3`     |
| Effect description  | Acumin Variable Concept | 400    | normal | 9px                 | `#fff6d3`     |
| Command token count | Compacta BT             | 700    | italic | 18px                | `#fff6d3`     |

**Color note:** The board background is very dark, so text uses cream/gold `#fff6d3` for readability. Dice and title pull from `leader.accentColor` to support theme customization.

---

## 7. Color Palette

| Element                   | Color                             | Notes                 |
| ------------------------- | --------------------------------- | --------------------- |
| Board background          | Very dark                         | Baked into SVG        |
| Text (name, descriptions) | `#fff6d3` (cream/gold)            | High contrast on dark |
| Dice value text           | `accentColor` (default `#00ff00`) | Theme-customizable    |
| Title text                | `accentColor` (default `#00ff00`) | Theme-customizable    |
| Hardcoded SVG accents     | Various                           | Never replaced        |

---

## 8. Implementation Architecture

### State Management

**State owner:** `src/trv/App.jsx` via `useLeaderState()` hook

- `updateLeader(field, value)` — Sets single top-level field, triggers auto-save to localStorage
- `updateSlot(slotIndex, field, value)` — Mutates slot array element, triggers auto-save
- `replaceLeader(leader)` — Wholesale replacement (used for loading files or gallery items)
- Auto-persistence to localStorage key: `"trv-crew-leader-v2"`
- Validation via `validateLeaderData()` on all loads (rejects unknown schema versions, enforces type coercion, sanitizes strings)

### Component Structure

```
App.jsx (state owner + root layout)
├─ CrewLeaderForm.jsx (sidebar, 6 CollapsibleSection blocks)
│  ├ Identity section (name, title, portrait)
│  ├ Theme section (accent color, name color)
│  ├ Special Ability section (name + description)
│  ├ Slots section (4 effect editors, 0-3 indexed)
│  ├ Back section (author metadata)
│  └ Info section (command tokens, description)
│
├─ CrewLeaderBoard.jsx (main canvas SVG renderer)
│  ├ Static background image: trv_board_bg.svg
│  ├ Portrait (chamfered polygon clip)
│  ├ Text overlays (name, title, ability, slots, tokens)
│  └ ResizeObserver for responsive scaling
│
└─ Floating controls
   ├ File I/O buttons (Save/Load via useFileIO)
   ├ Gallery modal (via useGallery)
   ├ Recent heroes dropdown (via useFileIO recents management)
   └ PDF export button
```

### Data Flow

1. **Form input** → `updateLeader()` or `updateSlot()` in `useLeaderState`
2. **State mutates** → component re-renders
3. **Auto-save fires** → updates localStorage + optional File System Access handle
4. **Board reflects changes** → SVG text elements replaced via React state binding

---

## 9. SVG Rendering & Text Positioning

### Portrait Rendering

- **Clipping:** Chamfered polygon (8-sided, 45° corner cuts ~15px)
- **Aspect ratio:** `preserveAspectRatio="xMidYMid slice"` (crop to fit)
- **Position:** x=220.4, y=53.6 (from boardLayout.js)
- **Bleed:** 5px outside guide boundary

### Text Rendering Strategy

**Single-line text** (name, ability, slot names):

- Direct `<text>` element with transform: `scale(scaleX, 1)` for horizontal stretching
- Example: leader name uses `scale(1.45 1)` to widen letterforms

**Multi-line text** (descriptions, author bio):

- Custom `<TextBlock>` component wraps text at character limit (e.g., 22 chars per line for slot descriptions)
- Line wrapping via `wrapText()` function (word-based, not character-based split)
- Each line rendered as `<tspan>` with dy adjustment (line-height ≈ 1.3× fontSize)

**Special rendering: Dice "★" (Star)**

- If dice value is `"★"` or contains `\u2605`, renders 5-point star polygon instead of text
- Star at `x, y` position with `r=12`, inner radius `r=5`, colored by `accentColor`

### Text Position Coordinates

From `src/trv/utils/boardLayout.js`:

| Element              | x        | y               | Details                                  |
| -------------------- | -------- | --------------- | ---------------------------------------- |
| Leader name          | 210      | 380             | Compacta TRV 74px, scaleX: 1.45          |
| Leader title         | 275      | 398             | Compacta BT 17px, colored by accentColor |
| Special ability name | 138      | 144.5           | Compacta TRV 26px italic                 |
| Special ability desc | 90       | 170             | Acumin 9px, wraps ~22 chars/line         |
| Slot 1 dice          | 80       | 466             | Compacta BT 23px                         |
| Slot 2 dice          | 375      | 466             | "                                        |
| Slot 3 dice          | 80       | 711             | "                                        |
| Slot 4 dice          | 375      | 711             | "                                        |
| Slot names (1-4)     | x varies | 500/603/603/603 | Compacta TRV 26px, scaleX: 0.8           |
| Command tokens       | 216      | 743             | Compacta BT 18px                         |

---

## 10. File I/O & Persistence

### Local Storage

- **Key:** `"trv-crew-leader-v2"`
- **Content:** Full leader JSON
- **Trigger:** Every `updateLeader()` or `updateSlot()` call
- **Load:** On app mount via `useLeaderState` hook

### File System Access API (Chrome/Edge)

- **Save:** `showSaveFilePicker()` → get handle → store in ref for future saves to same file
- **Load:** `showOpenFilePicker()` → read file → validate → load into state
- **Recents:** Stores up to 5 file handles + metadata in IndexedDB database `"trv-leader-recents"`
- **Fallback:** Legacy download/file-input on unsupported browsers

### Recent Heroes Management

- **Storage:** IndexedDB, store: `"recents"`
- **Per entry:** `{ id, fileName, savedAt, handle, leaderName, author_name, revision_no, slotCount }`
- **Display:** RecentLeaderRow.jsx renders 5 most recent
- **Deduplication:** By fileName; keeps newest by savedAt timestamp
- **Max items:** 5

---

## 11. Firebase & Community Gallery

### Data Submission

**Hook:** `useGallery.js`

**Validation before submit:**

- Crew leader name != default "CREW LEADER"
- author_name and revision_no both required
- At least one slot customized (effectName, dice, or description differs from default)

**Firebase operations:**

- Sign in with Google → submit to `leaders/pending/{hash}` collection
- Hash: SHA-256 of `(crewLeaderName, slots[].{effectName, dice, description})`
- Deduplication: Reject if hash exists in pending or approved
- Portrait data: Sanitized; payload rejected if >2MB

**Client-side cooldown:** 60 seconds between submissions

**Submission states:**

- **Pending:** User submission awaiting admin approval
- **Approved:** In community gallery, public load/download
- **Rejected:** User notified (future: email notification)

### Admin Operations

- **Fetch pending:** Admin dashboard loads unapproved submissions
- **Approve:** Move pending → approved collection
- **Reject:** Delete from pending
- **Delete published:** User or admin can delete from approved

### Withdrawal/Deletion

- Users can delete their own pending submissions (auth check via UID)
- Users can delete their own published submissions (auth check via UID)

---

## 12. Key Implementation Contracts for LLM Reference

| Contract                      | Details                                                                                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data mutation pattern**     | All state updates via `updateLeader()` or `updateSlot()` in App → flows through useLeaderState → auto-persists to localStorage + file handle |
| **SVG is static background**  | `trv_board_bg.svg` is imported as static image element, NOT dynamically manipulated (unlike RTDT which does color replacement)               |
| **Text positioning is fixed** | All x,y coordinates hardcoded from `boardLayout.js`; NO dynamic repositioning based on text length                                           |
| **Dice special case**         | If `dice === "★"` or `\u2605`, render polygon instead of text                                                                                |
| **Portrait clipping**         | Chamfered polygon (45° corners cut ~15px) + `preserveAspectRatio="xMidYMid slice"`                                                           |
| **Multi-line wrapping**       | Use `wrapText()` function with character limit; render lines as `<tspan>` array with dy offset                                               |
| **Slot array is 0-indexed**   | UI displays "Slot 1-4", but state stores [0-3]; expected sorted by dice value by user                                                        |
| **Validation on import**      | `validateLeaderData()` sanitizes all strings, coerces types, enforces char limits, rejects oversized portraits                               |
| **Firebase auth required**    | Google sign-in required for community submissions; admin panel checks `isAdmin()` role                                                       |
| **File I/O fallback chain**   | File System Access API (Chrome/Edge) → legacy download/upload → localStorage fallback                                                        |
| **Color customization**       | Only `accentColor` and `nameColor` are user-editable; all other SVG colors are hardcoded and never touched                                   |
| **Font availability**         | Compacta TRV, Compacta BT, Acumin Variable Concept must be available at render time or fallback to sans-serif                                |

---

_Reference guide for Thunder Road Vendetta crew leader board creator tool._  
_Last updated: 2026-03-18_  
_Based on: official game boards, SVG geometry, implementation codebase analysis._
