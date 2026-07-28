import { defaultCrewLeader } from "../data/defaultCrewLeader";
import { FIELD_IDS } from "./fieldRegistry";
import { createRecentsStore } from "../../shared/utils/recentsStore";

const STORAGE_KEY = "trv-crew-leader-v2";

/* ── localStorage persistence ── */

export function loadLeader() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultCrewLeader };
    const parsed = JSON.parse(raw);
    return {
      ...defaultCrewLeader,
      ...parsed,
      slots: parsed.slots || defaultCrewLeader.slots,
    };
  } catch {
    return { ...defaultCrewLeader };
  }
}

export function saveLeader(leader) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leader));
  } catch {
    /* ignore */
  }
}

export function clearLeaderStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

/* ── Serialization ── */

export function leaderToJson(leader) {
  return JSON.stringify(leader, null, 2);
}

/* ── Validation ── */

export function sanitizeString(str) {
  if (typeof str !== "string") return "";
  let s = str;
  s = s.replace(/<script[\s>][\s\S]*?<\/script\s*>/gi, "");
  s = s.replace(/<\/?[a-z][^>]*>/gi, "");
  s = s.replace(/\b(javascript|data|vbscript)\s*:/gi, "");
  s = s.replace(/\bon[a-z]+\s*=/gi, "");
  return s;
}

const FIELD_ID_SET = new Set(FIELD_IDS);
const HEX_RE = /^#[0-9a-f]{6}$/i;
const clampNum = (v, min, max) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.max(min, Math.min(max, v))
    : undefined;

// Strict allowlist for per-field overrides: only known field ids, only known
// keys, all values range/type-coerced. Anything else is dropped.
export function sanitizeFieldStyles(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const id of Object.keys(raw)) {
    if (!FIELD_ID_SET.has(id)) continue;
    const s = raw[id];
    if (!s || typeof s !== "object") continue;
    const clean = {};
    const dx = clampNum(s.dx, -2000, 2000);
    const dy = clampNum(s.dy, -2000, 2000);
    const rotation = clampNum(s.rotation, -360, 360);
    const fontSize = clampNum(s.fontSize, 1, 400);
    const w = clampNum(s.w, 4, 2000);
    if (dx !== undefined) clean.dx = dx;
    if (dy !== undefined) clean.dy = dy;
    if (rotation !== undefined) clean.rotation = rotation;
    if (fontSize !== undefined) clean.fontSize = fontSize;
    if (w !== undefined) clean.w = w;
    if (typeof s.color === "string" && HEX_RE.test(s.color)) clean.color = s.color;
    if (typeof s.italic === "boolean") clean.italic = s.italic;
    if (typeof s.bold === "boolean") clean.bold = s.bold;
    if (typeof s.shadow === "boolean") clean.shadow = s.shadow;
    if (typeof s.shadowColor === "string" && HEX_RE.test(s.shadowColor)) clean.shadowColor = s.shadowColor;
    const shadowSize = clampNum(s.shadowSize, 0, 5);
    if (shadowSize !== undefined) clean.shadowSize = shadowSize;
    const shadowOffset = clampNum(s.shadowOffset, 0, 10);
    if (shadowOffset !== undefined) clean.shadowOffset = shadowOffset;
    if (Object.keys(clean).length > 0) out[id] = clean;
  }
  return out;
}

export function validateLeaderData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { valid: false, error: "Invalid data: expected a JSON object." };
  }

  const leader = {
    ...defaultCrewLeader,
    schemaVersion: 2,
    crewLeaderName:
      typeof data.crewLeaderName === "string"
        ? sanitizeString(data.crewLeaderName).slice(0, 30)
        : defaultCrewLeader.crewLeaderName,
    crewLeaderTitle:
      typeof data.crewLeaderTitle === "string"
        ? sanitizeString(data.crewLeaderTitle).slice(0, 40)
        : defaultCrewLeader.crewLeaderTitle,
    portraitDataUrl:
      typeof data.portraitDataUrl === "string" &&
      /^data:image\/(jpeg|png|gif|webp);base64,/.test(data.portraitDataUrl)
        ? data.portraitDataUrl
        : null,
    specialAbilityName:
      typeof data.specialAbilityName === "string"
        ? sanitizeString(data.specialAbilityName).slice(0, 30)
        : defaultCrewLeader.specialAbilityName,
    specialAbilityDescription:
      typeof data.specialAbilityDescription === "string"
        ? sanitizeString(data.specialAbilityDescription).slice(0, 300)
        : defaultCrewLeader.specialAbilityDescription,
    commandTokens:
      typeof data.commandTokens === "number"
        ? Math.max(0, Math.min(9, Math.round(data.commandTokens)))
        : defaultCrewLeader.commandTokens,
    accentColor:
      typeof data.accentColor === "string" && /^#[0-9a-f]{6}$/i.test(data.accentColor)
        ? data.accentColor
        : defaultCrewLeader.accentColor,
    nameColor:
      typeof data.nameColor === "string" && /^#[0-9a-f]{6}$/i.test(data.nameColor)
        ? data.nameColor
        : defaultCrewLeader.nameColor,
    fieldStyles: sanitizeFieldStyles(data.fieldStyles),
    author_name:
      typeof data.author_name === "string"
        ? sanitizeString(data.author_name).slice(0, 40)
        : defaultCrewLeader.author_name,
    revision_no:
      typeof data.revision_no === "string"
        ? sanitizeString(data.revision_no).slice(0, 20)
        : defaultCrewLeader.revision_no,
    contact_info:
      typeof data.contact_info === "string"
        ? sanitizeString(data.contact_info).slice(0, 60)
        : defaultCrewLeader.contact_info,
    author_description:
      typeof data.author_description === "string"
        ? sanitizeString(data.author_description).slice(0, 300)
        : defaultCrewLeader.author_description,
  };

  // Validate slots array
  if (Array.isArray(data.slots)) {
    leader.slots = data.slots.slice(0, 4).map((s, i) => {
      const fallback = defaultCrewLeader.slots[i] || defaultCrewLeader.slots[0];
      if (!s || typeof s !== "object") return { ...fallback };
      return {
        effectName:
          typeof s.effectName === "string"
            ? sanitizeString(s.effectName).slice(0, 20)
            : fallback.effectName,
        dice:
          typeof s.dice === "string"
            ? sanitizeString(s.dice).slice(0, 5)
            : fallback.dice,
        description:
          typeof s.description === "string"
            ? sanitizeString(s.description).slice(0, 200)
            : fallback.description,
      };
    });
  }

  return { valid: true, leader };
}

/* ── Pending submission tracking ── */

const PENDING_KEY = "trv-pending-submission";

export function savePendingRef(hash, leaderName) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ hash, leaderName }));
  } catch {
    /* ignore */
  }
}

export function getPendingRef() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingRef() {
  localStorage.removeItem(PENDING_KEY);
}

/* ── Recent Leaders (IndexedDB + File System Access API) ── */

const recentsStore = createRecentsStore({ dbName: "trv-leader-recents" });

export const loadRecents = recentsStore.loadRecents;
export const removeFromRecents = recentsStore.removeFromRecents;
export const clearAllRecents = recentsStore.clearAllRecents;

export function addToRecents(fileHandle, leader) {
  return recentsStore.addToRecents(fileHandle, {
    leaderName: leader.crewLeaderName || "",
    author_name: leader.author_name || "",
    revision_no: leader.revision_no || "",
    slotCount: leader.slots?.length || 0,
  });
}

export async function loadLeaderFromHandle(fileHandle) {
  const permission = await fileHandle.requestPermission({ mode: "read" });
  if (permission !== "granted") throw new Error("Permission denied");
  const file = await fileHandle.getFile();
  const text = await file.text();
  return JSON.parse(text);
}
