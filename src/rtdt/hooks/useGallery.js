import {
  submitHero,
  withdrawPendingHero,
  isPendingHashValid,
} from "../utils/firebase";
import { savePendingRef, getPendingRef, clearPendingRef } from "../utils/heroIO";
import { DEFAULT_HERO_NAME, DEFAULT_VIRTUE_NAMES } from "../data/defaultHero";
import { useGallery as useGalleryShared } from "../../shared/hooks/useGallery";

const SHARE_DEFAULT_NAMES = [DEFAULT_HERO_NAME, ""];

const getShareIssues = (h) => {
  const issues = [];
  if (SHARE_DEFAULT_NAMES.includes((h.name || "").trim().toUpperCase()))
    issues.push("Give your hero a unique name.");
  const virtues = h.virtues || [];
  if (virtues.length === 0) issues.push("Add at least one virtue.");
  else if (
    virtues.every((v) =>
      DEFAULT_VIRTUE_NAMES.includes((v.name || "").trim().toUpperCase()),
    )
  )
    issues.push("Customize your virtue names (don't use the defaults).");
  if (!(h.author_name || "").trim())
    issues.push("Add your author name (Author Info section).");
  if (!(h.revision_no || "").trim())
    issues.push("Add a revision number (Author Info section).");
  if (!(h.contact || "").trim())
    issues.push("Add contact info (Author Info section).");
  return issues;
};

export function useGallery({ heroState, clearFileHandle, confirm, showAlert, showStatus }) {
  const { hero, replaceHero, hasUnsavedChanges } = heroState;
  return useGalleryShared({
    item: hero,
    replaceItem: replaceHero,
    hasUnsavedChanges,
    clearFileHandle,
    confirm,
    showAlert,
    showStatus,
    getShareIssues,
    submit: submitHero,
    withdrawPending: withdrawPendingHero,
    isPendingHashValid,
    savePendingRef,
    getPendingRef,
    clearPendingRef,
    getName: (h) => h.name,
    getPriorName: (prior) => prior.heroName,
    itemLabel: "hero",
  });
}
