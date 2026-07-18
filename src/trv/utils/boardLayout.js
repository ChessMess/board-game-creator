// Board layout constants for trv_board_bg.svg (viewBox 1027.3709 × 789.92139)
//
// All positions from user-placed Inkscape guide rectangles (see the
// `position-guides` layer in the SVG, display:none, for the authoritative boxes).
// LEFT  (x: 0–519)    = front game face (all editable content)
// RIGHT (x: 519–1027) = back-of-board metadata (author / version / contact)

// ═══════════════════════════════════════════════════════════════════════════
// FRONT BOARD (LEFT side, x=0–519)
// ═══════════════════════════════════════════════════════════════════════════

// Portrait — guide-portrait
export const PORTRAIT = { x: 220.4, y: 53.6, w: 181.2, h: 243.4 };

// Special ability — unique per leader (top of board)
// guide-special-ability-name: x=69.0, y=124.5, w=133.6, h=23.7
export const SPECIAL_ABILITY_NAME_POS = { x: 138, y: 144.5, anchor: "middle" };
// guide-special-ability-desc: x=71.2, y=154.6, w=128.8, h=117.4
export const SPECIAL_ABILITY_DESC_POS = { x: 90, y: 170 };
export const SPECIAL_ABILITY_DESC_AREA = {
  x: 71.2,
  y: 154.6,
  w: 128.8,
  h: 117.4,
};

// Crew leader name — guide-name: x=96.6, y=313.4, w=276.0, h=69.3
export const NAME_POS = { x: 210, y: 380, anchor: "middle" };

// Nickname / catchphrase — guide-title: x=104.2, y=388.0, w=246.3, h=19.0
export const TITLE_POS = { x: 275, y: 398, anchor: "middle" };

// ── 2×2 Effect Slot Grid ──
// Slot positions indexed 0–3 (displayed as Slots 1–4)

export const SLOT_DICE_POS = [
  { x: 80, y: 466 }, // Slot 1 — guide-front-slot-1-dice center
  { x: 375, y: 466 }, // Slot 2 — guide-front-slot-2-dice center
  { x: 80, y: 711 }, // Slot 3 — guide-front-slot-3-dice center
  { x: 375, y: 711 }, // Slot 4 — guide-front-slot-4-dice center
];

export const SLOT_NAME_POS = [
  { x: 212, y: 508, anchor: "end" }, // Slot 1 — right edge of guide (right-aligned)
  { x: 242, y: 508, anchor: "start" }, // Slot 2 — left edge of guide (left-aligned)
  { x: 212, y: 612, anchor: "end" }, // Slot 3 — right edge of guide (right-aligned)
  { x: 238, y: 613, anchor: "start" }, // Slot 4 — left edge of guide (left-aligned)
];

export const SLOT_DESC_POS = [
  { x: 161.2, y: 525, w: 114.1 }, // Slot 1 — guide-front-slot-1-desc
  { x: 288.3, y: 525, w: 114.2 }, // Slot 2 — guide-front-slot-2-desc
  { x: 170.9, y: 629, w: 96.2 }, // Slot 3 — guide-front-slot-3-desc
  { x: 283.3, y: 629, w: 98.9 }, // Slot 4 — guide-front-slot-4-desc
];

// Command token count — guide-front-command-tokens center
export const COMMAND_TOKENS_POS = { x: 216, y: 743 };

// ═══════════════════════════════════════════════════════════════════════════
// BACK METADATA (RIGHT side of board, x ≈ 668–965)
// ═══════════════════════════════════════════════════════════════════════════

// guide-back-app-title: x=706.6, y=94.3, w=218.7, h=30.1
export const BACK_APP_TITLE_POS = { x: 815.9, y: 115, anchor: "middle" };
// guide-headshot: x=771.0, y=132.3, w=89.9, h=78.5
export const BACK_HEADSHOT = { x: 771.0, y: 132.3, w: 89.9, h: 78.5 };
// guide-back-version: x=742.4, y=222.9, w=147.0, h=23.0
export const BACK_VERSION_POS = { x: 815.9, y: 250, anchor: "middle" };
// guide-back-author-name: x=685.4, y=483.3, w=261.1, h=29.7
export const BACK_AUTHOR_NAME_POS = { x: 815.9, y: 504, anchor: "middle" };
// guide-back-contact-info: x=674.8, y=518.6, w=282.3, h=29.5
export const BACK_CONTACT_POS = { x: 815.9, y: 539, anchor: "middle" };
// guide-back-author-description: x=667.3, y=550.3, w=297.3, h=151.1
export const BACK_AUTHOR_DESC_POS = { x: 815.9, y: 565, w: 297.3 };
