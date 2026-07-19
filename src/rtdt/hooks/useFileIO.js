import {
  heroToJson,
  validateHeroData,
  loadHeroFromHandle,
  loadRecents,
  addToRecents,
  removeFromRecents,
  clearAllRecents,
} from "../utils/heroIO";
import { DEFAULT_HERO_NAME } from "../data/defaultHero";
import { useFileIO as useFileIOShared } from "../../shared/hooks/useFileIO";

export function useFileIO({ heroState, confirm, showPrompt, showStatus }) {
  const { hero, replaceHero, hasUnsavedChanges, markSaved } = heroState;
  return useFileIOShared({
    item: hero,
    replaceItem: replaceHero,
    hasUnsavedChanges,
    markSaved,
    confirm,
    showPrompt,
    showStatus,
    toJson: heroToJson,
    validateData: (data) => {
      const result = validateHeroData(data);
      return result.valid ? { valid: true, item: result.hero } : result;
    },
    loadFromHandle: loadHeroFromHandle,
    loadRecents,
    addToRecents,
    removeFromRecents,
    clearAllRecents,
    getName: (h) => h.name,
    defaultName: DEFAULT_HERO_NAME,
    filenameFallback: "hero",
    itemLabel: "hero",
    getRecentName: (entry) => entry.heroName,
    handoffStorageKey: "rtdt-hero-handoff",
    handoffField: "hero",
    previewPath: "rtdt",
  });
}
