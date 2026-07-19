import {
  defaultHero,
  MAX_VIRTUES,
  createEmptyVirtue,
} from "../data/defaultHero";
import { THEME_PRESETS } from "../data/themes";
import { createRecentsStore } from "../../shared/utils/recentsStore";

const STORAGE_KEY = "rtdt-hero-v2";
const V1_STORAGE_KEY = "rtdt-hero";
const PENDING_KEY = "rtdt-my-pending";
const PENDING_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function savePendingRef(hash, heroName) {
  localStorage.setItem(PENDING_KEY, JSON.stringify({ hash, heroName, savedAt: Date.now() }));
}

export function getPendingRef() {
  try {
    const entry = JSON.parse(localStorage.getItem(PENDING_KEY));
    if (!entry) return null;
    if (Date.now() - entry.savedAt > PENDING_TTL_MS) {
      localStorage.removeItem(PENDING_KEY);
      return null;
    }
    return entry;
  } catch { return null; }
}

export function clearPendingRef() {
  localStorage.removeItem(PENDING_KEY);
}

/**
 * Strip dangerous content from a string field.
 * Removes HTML tags, script content, event handlers, javascript: URIs,
 * and other potential XSS vectors. Returns plain text only.
 */
export function sanitizeString(str) {
  if (typeof str !== "string") return "";
  let s = str;
  // Remove <script>...</script> blocks (including nested/multiline)
  s = s.replace(/<script[\s>][\s\S]*?<\/script\s*>/gi, "");
  // Remove all HTML/XML tags
  s = s.replace(/<\/?[a-z][^>]*>/gi, "");
  // Remove javascript:/data:/vbscript: URI schemes
  s = s.replace(/\b(javascript|data|vbscript)\s*:/gi, "");
  // Remove on* event handler patterns (e.g. onerror=, onclick=)
  s = s.replace(/\bon[a-z]+\s*=/gi, "");
  // Remove CSS expression() / url() injection patterns
  s = s.replace(/expression\s*\(/gi, "");
  // Collapse whitespace left behind
  s = s.replace(/\s{2,}/g, " ").trim();
  return s;
}

/**
 * Detect whether imported data looks like V1 format.
 */
function looksLikeV1(data) {
  if (data.schemaVersion === 1) return true;
  if (data.schemaVersion >= 2) return false;
  // No schemaVersion — sniff fields
  return (
    typeof data.flavorLine1 === "string" ||
    typeof data.flavorLine2 === "string" ||
    typeof data.championTerrain === "string" ||
    (Array.isArray(data.virtues) &&
      data.virtues[0] &&
      "advantageType" in data.virtues[0])
  );
}

/**
 * Validate and sanitize imported V2 hero data.
 * Merges with defaultHero so missing fields get defaults.
 * Auto-migrates V1 data when detected.
 */
export function validateHeroData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { valid: false, error: "Invalid data: expected a JSON object." };
  }

  // Auto-migrate V1 imports
  if (looksLikeV1(data)) {
    const migrated = migrateV1ToV2(data);
    if (migrated) data = migrated;
  }

  const hero = {
    schemaVersion: 3,
    name:
      typeof data.name === "string"
        ? sanitizeString(data.name).slice(0, 20)
        : defaultHero.name,
    warriors:
      typeof data.warriors === "number"
        ? Math.max(1, Math.min(99, data.warriors))
        : defaultHero.warriors,
    spirit:
      typeof data.spirit === "number"
        ? Math.max(0, Math.min(9, data.spirit))
        : defaultHero.spirit,
    portraitDataUrl:
      typeof data.portraitDataUrl === "string" &&
      (data.portraitDataUrl.startsWith("data:image/jpeg;base64,") ||
        data.portraitDataUrl.startsWith("data:image/png;base64,") ||
        data.portraitDataUrl.startsWith("data:image/gif;base64,") ||
        data.portraitDataUrl.startsWith("data:image/webp;base64,"))
        ? data.portraitDataUrl
        : null,
    flavorText:
      typeof data.flavorText === "string"
        ? sanitizeString(data.flavorText).slice(0, 120)
        : sanitizeString(
            `${data.flavorLine1 || ""} ${data.flavorLine2 || ""}`,
          )
            .trim()
            .slice(0, 120) || defaultHero.flavorText,
    bannerAction:
      typeof data.bannerAction === "string"
        ? sanitizeString(data.bannerAction).slice(0, 40)
        : defaultHero.bannerAction,
    moveSubtitle:
      typeof data.moveSubtitle === "string"
        ? sanitizeString(data.moveSubtitle).slice(0, 30)
        : defaultHero.moveSubtitle,
    moveInstructions:
      typeof data.moveInstructions === "string"
        ? sanitizeString(data.moveInstructions).slice(0, 40)
        : defaultHero.moveInstructions,
    battleSubtitle:
      typeof data.battleSubtitle === "string"
        ? sanitizeString(data.battleSubtitle).slice(0, 40)
        : defaultHero.battleSubtitle,
    questSubtitle:
      typeof data.questSubtitle === "string"
        ? sanitizeString(data.questSubtitle).slice(0, 50)
        : defaultHero.questSubtitle,
    cleanseSubtitle:
      typeof data.cleanseSubtitle === "string"
        ? sanitizeString(data.cleanseSubtitle).slice(0, 50)
        : defaultHero.cleanseSubtitle,
    reinforceSubtitle:
      typeof data.reinforceSubtitle === "string"
        ? sanitizeString(data.reinforceSubtitle).slice(0, 30)
        : defaultHero.reinforceSubtitle,
    bazaarInstructions:
      typeof data.bazaarInstructions === "string"
        ? sanitizeString(data.bazaarInstructions).slice(0, 80)
        : defaultHero.bazaarInstructions,
    villageInstructions:
      typeof data.villageInstructions === "string"
        ? sanitizeString(data.villageInstructions).slice(0, 80)
        : defaultHero.villageInstructions,
    sanctuaryInstructions:
      typeof data.sanctuaryInstructions === "string"
        ? sanitizeString(data.sanctuaryInstructions).slice(0, 80)
        : defaultHero.sanctuaryInstructions,
    citadelInstructions:
      typeof data.citadelInstructions === "string"
        ? sanitizeString(data.citadelInstructions).slice(0, 80)
        : defaultHero.citadelInstructions,
    endOfTurnAction:
      typeof data.endOfTurnAction === "string"
        ? sanitizeString(data.endOfTurnAction).slice(0, 50)
        : defaultHero.endOfTurnAction,
    author_name:
      typeof data.author_name === "string"
        ? sanitizeString(data.author_name).slice(0, 50)
        : "",
    revision_no:
      typeof data.revision_no === "string"
        ? sanitizeString(data.revision_no).slice(0, 8)
        : "1.0",
    description:
      typeof data.description === "string"
        ? sanitizeString(data.description).slice(0, 1000)
        : "",
    contact:
      typeof data.contact === "string"
        ? sanitizeString(data.contact).slice(0, 250)
        : "",
    theme:
      typeof data.theme === "string" &&
      (data.theme === "custom" || data.theme in THEME_PRESETS)
        ? data.theme
        : "orphaned_scion",
    customTheme:
      data.theme === "custom" &&
      data.customTheme &&
      typeof data.customTheme === "object" &&
      Array.isArray(data.customTheme.boardColors)
        ? data.customTheme
        : null,
    virtues: [],
  };

  const srcVirtues = Array.isArray(data.virtues)
    ? data.virtues.slice(0, MAX_VIRTUES)
    : [];
  for (const src of srcVirtues) {
    if (!src || typeof src !== "object") continue;
    const empty = createEmptyVirtue();
    // Migrate old advantageType field into description if description is empty
    let desc = typeof src.description === "string" ? src.description : "";
    if (!desc && typeof src.advantageType === "string" && src.advantageType) {
      desc = `+1 ${src.advantageType} Advantage`;
    }
    hero.virtues.push({
      name:
        typeof src.name === "string"
          ? sanitizeString(src.name).slice(0, 12)
          : empty.name,
      type: ["advantage", "standard", "champion"].includes(src.type)
        ? src.type
        : "standard",
      description: sanitizeString(desc),
      kingdom:
        typeof src.kingdom === "string"
          ? sanitizeString(src.kingdom).slice(0, 20)
          : "",
    });
  }

  return { valid: true, hero };
}

/**
 * Migrate V1 hero data to V2 format.
 */
export function migrateV1ToV2(v1Hero) {
  if (!v1Hero || typeof v1Hero !== "object") return null;

  const virtues = [];
  const srcVirtues = Array.isArray(v1Hero.virtues) ? v1Hero.virtues : [];

  for (let i = 0; i < srcVirtues.length && i < MAX_VIRTUES; i++) {
    const src = srcVirtues[i] || {};
    if (i === 0) {
      const advType = src.advantageType || "TYPE";
      virtues.push({
        name: src.name || "VIRTUE 1",
        type: "advantage",
        description: `+1 ${advType} Advantage`,
        kingdom: "",
      });
    } else {
      let desc = "";
      if (typeof src.description === "string") {
        desc = src.description;
      } else if (
        typeof src.line1 === "string" ||
        typeof src.line2 === "string"
      ) {
        desc = [src.line1 || "", src.line2 || ""].filter(Boolean).join(" ");
      }
      virtues.push({
        name: src.name || `VIRTUE ${i + 1}`,
        type: "standard",
        description: desc,
        kingdom: "",
      });
    }
  }

  // Auto-create a champion virtue from V1's top-level champion fields
  const champKingdom = v1Hero.championKingdom || "";
  const champTerrain = v1Hero.championTerrain || "";
  if ((champKingdom || champTerrain) && virtues.length < MAX_VIRTUES) {
    virtues.push({
      name: "CHAMPION",
      type: "champion",
      description: champTerrain ? `+2 Wild Advantages in ${champTerrain}` : "",
      kingdom: champKingdom,
    });
  }

  return {
    ...defaultHero,
    name: v1Hero.name || defaultHero.name,
    warriors: v1Hero.warriors || defaultHero.warriors,
    spirit: v1Hero.spirit ?? defaultHero.spirit,
    portraitDataUrl: v1Hero.portraitDataUrl || null,
    flavorText:
      `${v1Hero.flavorLine1 || ""} ${v1Hero.flavorLine2 || ""}`
        .trim()
        .slice(0, 120) || defaultHero.flavorText,
    bannerAction: v1Hero.bannerAction || defaultHero.bannerAction,
    author_name: v1Hero.author_name || "",
    revision_no: v1Hero.revision_no || "",
    description: v1Hero.description || "",
    contact: v1Hero.contact || "",
    virtues,
  };
}

/**
 * Load hero from localStorage. Tries V2 key first, then migrates V1, then defaults.
 */
export function loadHero() {
  try {
    const v2Raw = localStorage.getItem(STORAGE_KEY);
    if (v2Raw) {
      const result = validateHeroData(JSON.parse(v2Raw));
      if (result.valid) return result.hero;
    }
  } catch {
    /* fall through */
  }

  try {
    const v1Raw = localStorage.getItem(V1_STORAGE_KEY);
    if (v1Raw) {
      const migrated = migrateV1ToV2(JSON.parse(v1Raw));
      if (migrated) {
        const result = validateHeroData(migrated);
        if (result.valid) return result.hero;
      }
    }
  } catch {
    /* fall through */
  }

  return {
    ...defaultHero,
    virtues: defaultHero.virtues.map((v) => ({ ...v })),
  };
}

/**
 * Save hero to localStorage.
 */
export function saveHero(hero) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(hero));
}

/**
 * Returns the byte size of the stored hero data.
 */
export function getStorageBytes() {
  const val = localStorage.getItem(STORAGE_KEY) ?? "";
  return new Blob([val]).size;
}

/**
 * Serialize hero to indented JSON string.
 */
export function heroToJson(hero) {
  return JSON.stringify(hero, null, 2);
}

/**
 * Check if a File object or data URL string is a GIF.
 */
export function isGif(fileOrDataUrl) {
  if (typeof fileOrDataUrl === "string")
    return fileOrDataUrl.startsWith("data:image/gif");
  return fileOrDataUrl?.type === "image/gif";
}

/**
 * Resize and compress an image file using Canvas API.
 */
export function optimizeImage(
  file,
  { maxWidth = 540, maxHeight = 740, quality = 0.8 } = {},
) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for optimization."));
    };

    img.src = url;
  });
}

/* ── Recent Heroes (IndexedDB + File System Access API) ── */

const recentsStore = createRecentsStore({ dbName: "rtdt-hero-recents" });

export const loadRecents = recentsStore.loadRecents;
export const removeFromRecents = recentsStore.removeFromRecents;
export const clearAllRecents = recentsStore.clearAllRecents;

export function addToRecents(fileHandle, hero) {
  return recentsStore.addToRecents(fileHandle, {
    heroName: hero.name || "",
    author_name: hero.author_name || "",
    revision_no: hero.revision_no || "",
    virtueCount: hero.virtues?.length || 0,
  });
}

export async function loadHeroFromHandle(fileHandle) {
  const permission = await fileHandle.requestPermission({ mode: "read" });
  if (permission !== "granted") throw new Error("Permission denied");
  const file = await fileHandle.getFile();
  const text = await file.text();
  return JSON.parse(text);
}
