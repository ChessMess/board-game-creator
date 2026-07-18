import {
  submitLeader,
  withdrawPendingLeader,
  isPendingHashValid,
} from "../utils/firebase";
import { savePendingRef, getPendingRef, clearPendingRef } from "../utils/leaderIO";
import { DEFAULT_CREW_LEADER_NAME, DEFAULT_EFFECT_NAMES } from "../data/defaultCrewLeader";
import { useGallery as useGalleryShared } from "../../shared/hooks/useGallery";

const SHARE_DEFAULT_NAMES = [DEFAULT_CREW_LEADER_NAME, ""];

const getShareIssues = (leader) => {
  const issues = [];
  if (SHARE_DEFAULT_NAMES.includes((leader.crewLeaderName || "").trim().toUpperCase()))
    issues.push("Give your crew leader a unique name.");
  const slots = leader.slots || [];
  const allDefaultEffects = slots.every((s) =>
    DEFAULT_EFFECT_NAMES.includes((s.effectName || "").trim().toUpperCase()),
  );
  const allEmptyDescs = slots.every((s) => !(s.description || "").trim());
  if (allDefaultEffects && allEmptyDescs)
    issues.push("Customize your effect slots (change names or add descriptions).");
  if (!(leader.author_name || "").trim())
    issues.push("Add your author name (Author Info section).");
  if (!(leader.revision_no || "").trim())
    issues.push("Add a revision number (Author Info section).");
  if (!(leader.contact_info || "").trim())
    issues.push("Add contact info (Author Info section).");
  return issues;
};

export function useGallery({ leaderState, clearFileHandle, confirm, showAlert, showStatus }) {
  const { leader, replaceLeader, hasUnsavedChanges } = leaderState;
  return useGalleryShared({
    item: leader,
    replaceItem: replaceLeader,
    hasUnsavedChanges,
    clearFileHandle,
    confirm,
    showAlert,
    showStatus,
    getShareIssues,
    submit: submitLeader,
    withdrawPending: withdrawPendingLeader,
    isPendingHashValid,
    savePendingRef,
    getPendingRef,
    clearPendingRef,
    getName: (l) => l.crewLeaderName,
    getPriorName: (prior) => prior.leaderName,
    itemLabel: "crew leader",
    shortLabel: "leader",
  });
}
