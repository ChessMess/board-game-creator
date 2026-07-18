// Single source of truth for the 17 editable front-board text fields.
//
// Drives both the board render (CrewLeaderBoard) and the per-field style
// controls (CrewLeaderForm). Each entry carries the field's DEFAULT typography
// + position; a sparse `leader.fieldStyles[id]` override wins over these.
//
// - anchor:   render origin (from boardLayout, hand-tuned) + textAnchor
// - font:     default family / weight / style / size
// - color:    hex, or sentinel 'accent' | 'name' resolved from leader theme
// - scaleX:   horizontal squash/stretch baked into the design (1 = none)
// - fitBox:   authoritative box from the SVG `position-guides` layer (used by
//             Phase 3 auto-fit); {x,y,w,h} in SVG user units
// - anchorV:  'bottom' → multi-line blocks grow upward; 'top' → grow downward
// - multiline: whether the field wraps
// - kind:     'text' | 'dice' | 'number'

import {
  NAME_POS,
  TITLE_POS,
  SPECIAL_ABILITY_NAME_POS,
  SPECIAL_ABILITY_DESC_POS,
  SLOT_DICE_POS,
  SLOT_NAME_POS,
  SLOT_DESC_POS,
  COMMAND_TOKENS_POS,
} from "./boardLayout";

const COMPACTA_TRV = "'Compacta TRV', sans-serif";
const COMPACTA_BT = "'Compacta BT', 'Compacta', sans-serif";
const ACUMIN = "'Acumin Variable Concept', sans-serif";
const CREAM = "#fff6d3";

// Guide boxes for the four slots, indexed 0–3 (from the position-guides layer).
const SLOT_DICE_BOX = [
  { x: 59.36, y: 438.31, w: 44.71, h: 32.67 },
  { x: 352.99, y: 439.25, w: 44.77, h: 30.78 },
  { x: 59.36, y: 683.25, w: 44.71, h: 32.71 },
  { x: 353.03, y: 683.25, w: 44.71, h: 32.71 },
];
const SLOT_NAME_BOX = [
  { x: 126.49, y: 488.8, w: 92.42, h: 22.42 },
  { x: 230.63, y: 488.84, w: 98.73, h: 22.34 },
  { x: 104.68, y: 592.86, w: 114.09, h: 22.15 },
  { x: 232.73, y: 592.86, w: 114.37, h: 22.15 },
];
const SLOT_DESC_BOX = [
  { x: 104.14, y: 518.94, w: 114.12, h: 55.5 },
  { x: 231.22, y: 519.61, w: 114.15, h: 54.43 },
  { x: 122.85, y: 620.25, w: 96.16, h: 41.04 },
  { x: 233.82, y: 620.68, w: 98.92, h: 40.2 },
];

// Top-level (leader.*) fields.
const LEADER_FIELDS = [
  {
    id: "name",
    prop: "crewLeaderName",
    label: "Name",
    anchor: { x: NAME_POS.x, y: NAME_POS.y, textAnchor: NAME_POS.anchor },
    font: { family: COMPACTA_TRV, weight: 400, style: "italic", size: 74 },
    color: "name",
    scaleX: 1.45,
    letterSpacing: -2,
    fitBox: { x: 96.57, y: 313.35, w: 275.96, h: 69.33 },
    anchorV: "bottom",
    multiline: true,
    maxLines: 2,
    lineHeightRatio: 0.95,
    kind: "text",
  },
  {
    id: "title",
    prop: "crewLeaderTitle",
    label: "Nickname / Catchphrase",
    anchor: { x: TITLE_POS.x, y: TITLE_POS.y, textAnchor: TITLE_POS.anchor },
    font: { family: COMPACTA_BT, weight: 700, style: "italic", size: 17 },
    color: "accent",
    scaleX: 1,
    fitBox: { x: 104.24, y: 388.05, w: 246.33, h: 19.03 },
    anchorV: "bottom",
    multiline: false,
    kind: "text",
  },
  {
    id: "abilityName",
    prop: "specialAbilityName",
    label: "Ability Name",
    anchor: {
      x: SPECIAL_ABILITY_NAME_POS.x,
      y: SPECIAL_ABILITY_NAME_POS.y,
      textAnchor: SPECIAL_ABILITY_NAME_POS.anchor,
    },
    font: { family: COMPACTA_TRV, weight: 400, style: "italic", size: 26 },
    color: CREAM,
    scaleX: 1,
    fitBox: { x: 69.05, y: 124.48, w: 133.61, h: 23.69 },
    anchorV: "bottom",
    multiline: true,
    maxLines: 2,
    lineHeightRatio: 0.95,
    gapBonus: 20, // may grow upward into the gap under the portrait art
    kind: "text",
  },
  {
    id: "abilityDesc",
    prop: "specialAbilityDescription",
    label: "Ability Description",
    anchor: {
      x: SPECIAL_ABILITY_DESC_POS.x,
      y: SPECIAL_ABILITY_DESC_POS.y,
      textAnchor: "start",
    },
    font: { family: ACUMIN, weight: 300, style: "normal", size: 10 },
    color: CREAM,
    scaleX: 1,
    fitBox: { x: 71.16, y: 154.63, w: 128.81, h: 117.35 },
    anchorV: "top",
    multiline: true,
    lineHeightRatio: 1.2,
    kind: "text",
  },
  {
    id: "commandTokens",
    prop: "commandTokens",
    label: "Command Tokens",
    anchor: {
      x: COMMAND_TOKENS_POS.x,
      y: COMMAND_TOKENS_POS.y,
      textAnchor: "middle",
    },
    font: { family: COMPACTA_BT, weight: 700, style: "italic", size: 18 },
    color: CREAM,
    scaleX: 1,
    fitBox: { x: 200.77, y: 725.4, w: 21.87, h: 21.57 },
    anchorV: "bottom",
    multiline: false,
    kind: "number",
  },
];

// Per-slot fields (dice / effect name / description) for slots 0–3.
function slotFields(i) {
  return [
    {
      id: `dice${i}`,
      slot: i,
      key: "dice",
      label: `Slot ${i + 1} Dice`,
      anchor: { x: SLOT_DICE_POS[i].x, y: SLOT_DICE_POS[i].y, textAnchor: "middle" },
      font: { family: COMPACTA_BT, weight: 700, style: "normal", size: 30 },
      color: "accent",
      scaleX: 1,
      fitBox: SLOT_DICE_BOX[i],
      anchorV: "bottom",
      multiline: false,
      kind: "dice",
    },
    {
      id: `effect${i}`,
      slot: i,
      key: "effectName",
      label: `Slot ${i + 1} Effect`,
      anchor: {
        x: SLOT_NAME_POS[i].x,
        y: SLOT_NAME_POS[i].y,
        textAnchor: SLOT_NAME_POS[i].anchor,
      },
      font: { family: COMPACTA_TRV, weight: 400, style: "italic", size: 26 },
      color: CREAM,
      scaleX: 0.8,
      fitBox: SLOT_NAME_BOX[i],
      anchorV: "bottom",
      multiline: false,
      kind: "text",
    },
    {
      id: `desc${i}`,
      slot: i,
      key: "description",
      label: `Slot ${i + 1} Description`,
      anchor: { x: SLOT_DESC_POS[i].x, y: SLOT_DESC_POS[i].y, textAnchor: "middle" },
      font: { family: ACUMIN, weight: 300, style: "normal", size: 9 },
      color: CREAM,
      scaleX: 1,
      fitBox: SLOT_DESC_BOX[i],
      anchorV: "top",
      multiline: true,
      lineHeightRatio: 1.2,
      kind: "text",
    },
  ];
}

export const FIELD_REGISTRY = [
  ...LEADER_FIELDS,
  ...slotFields(0),
  ...slotFields(1),
  ...slotFields(2),
  ...slotFields(3),
];

export const FIELD_IDS = FIELD_REGISTRY.map((f) => f.id);

const BY_ID = Object.fromEntries(FIELD_REGISTRY.map((f) => [f.id, f]));
export function getField(id) {
  return BY_ID[id];
}

// Default fit-box WIDTH for a field (SVG user units, final/post-stretch space),
// derived from its guide box + anchor. Shared by the board's auto-fit and the
// edge-handle drag so both start from the same baseline. Matches usableBox().
export function defaultBoxWidth(field) {
  const g = field.fitBox;
  const a = field.anchor;
  const gRight = g.x + g.w;
  let w;
  if (a.textAnchor === "end") w = a.x - g.x;
  else if (a.textAnchor === "start") w = gRight - a.x;
  else w = 2 * Math.min(a.x - g.x, gRight - a.x);
  return Math.max(4, w - 3);
}

// Resolve a field's current value out of the leader object.
export function getFieldValue(leader, field) {
  if (field.slot != null) return leader.slots?.[field.slot]?.[field.key] ?? "";
  return leader[field.prop] ?? "";
}

// Resolve the effective render style for a field: registry default with the
// sparse override layered on top, theme sentinels resolved to concrete colors.
export function resolveFieldStyle(field, override = {}, { accent, name } = {}) {
  let color = override.color;
  if (color == null) {
    color =
      field.color === "accent"
        ? accent
        : field.color === "name"
          ? name
          : field.color;
  }
  return {
    fontFamily: field.font.family,
    fontSize: override.fontSize ?? field.font.size,
    fontStyle: override.italic == null ? field.font.style : override.italic ? "italic" : "normal",
    fontWeight: override.bold == null ? field.font.weight : override.bold ? 700 : 400,
    fill: color,
    letterSpacing: field.letterSpacing ? `${field.letterSpacing}px` : undefined,
    dx: override.dx || 0,
    dy: override.dy || 0,
    rotation: override.rotation || 0,
  };
}
