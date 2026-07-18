import { serverTimestamp } from "../../shared/utils/firebaseCore";
import { createGalleryApi } from "../../shared/utils/galleryApi";
import { sanitizeString } from "./heroIO";
import { DEFAULT_HERO_NAME, DEFAULT_VIRTUE_NAMES } from "../data/defaultHero";

const DEFAULT_NAMES = [DEFAULT_HERO_NAME, ""];

const api = createGalleryApi({
  entityPath: "heroes",
  itemLabel: "hero",
  shortLabelPlural: "heroes",

  // Fixed: previously hashed v.line1/v.line2, fields that don't exist on the
  // V2/V3 virtue schema (only `description`/`kingdom` do) — the duplicate hash
  // ignored virtue description text entirely.
  hashFields: (hero) => ({
    name: hero.name,
    warriors: hero.warriors,
    spirit: hero.spirit,
    virtues: (hero.virtues || []).map((v) => ({
      name: v.name,
      description: v.description,
      kingdom: v.kingdom,
    })),
  }),

  buildPayload: (hero, { user, portrait }) => {
    const sanitizedVirtues = (hero.virtues || []).map((v) => ({
      name: sanitizeString(v.name || ""),
      type: ["advantage", "standard", "champion"].includes(v.type)
        ? v.type
        : "standard",
      description: sanitizeString(v.description || ""),
      kingdom: sanitizeString(v.kingdom || ""),
    }));

    return {
      name: sanitizeString(hero.name || DEFAULT_HERO_NAME),
      schemaVersion: hero.schemaVersion || 2,
      warriors: hero.warriors,
      spirit: hero.spirit,
      portraitDataUrl: portrait,
      flavorText: sanitizeString(hero.flavorText || ""),
      bannerAction: sanitizeString(hero.bannerAction || ""),
      author_name: sanitizeString(hero.author_name || ""),
      revision_no: sanitizeString(hero.revision_no || ""),
      description: sanitizeString(hero.description || ""),
      virtues: sanitizedVirtues,
      theme: hero.theme || "orphaned_scion",
      customTheme:
        hero.theme === "custom" && hero.customTheme ? hero.customTheme : null,
      submittedBy: user.uid,
      createdAt: serverTimestamp(),
    };
  },

  rejectIfDefault: (hero) => {
    const heroName = (hero.name || "").trim().toUpperCase();
    if (DEFAULT_NAMES.includes(heroName)) {
      return "Please give your hero a name before sharing.";
    }
    const virtues = hero.virtues || [];
    if (virtues.length === 0) {
      return "Please add at least one virtue before sharing.";
    }
    const allDefault = virtues.every((v) =>
      DEFAULT_VIRTUE_NAMES.includes((v.name || "").trim().toUpperCase()),
    );
    if (allDefault) {
      return "Please customize your virtue names before sharing.";
    }
    return null;
  },

  maxPortraitBytes: 2_000_000,
  cooldownMs: 60_000,
});

export const submitHero = api.submit;
export const fetchApprovedHeroes = api.fetchApproved;
export const fetchPendingHeroes = api.fetchPending;
export const approveHero = api.approve;
export const rejectHero = api.reject;
export const deleteApprovedHero = api.deleteApproved;
export const withdrawPendingHero = api.withdrawPending;
export const isPendingHashValid = api.isPendingHashValid;
export const deleteOwnHero = api.deleteOwn;
