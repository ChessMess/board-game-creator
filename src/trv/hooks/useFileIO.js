import {
  leaderToJson,
  validateLeaderData,
  loadLeaderFromHandle,
  loadRecents,
  addToRecents,
  removeFromRecents,
  clearAllRecents,
} from "../utils/leaderIO";
import { DEFAULT_CREW_LEADER_NAME } from "../data/defaultCrewLeader";
import { useFileIO as useFileIOShared } from "../../shared/hooks/useFileIO";

export function useFileIO({ leaderState, confirm, showPrompt, showStatus }) {
  const { leader, replaceLeader, hasUnsavedChanges, markSaved } = leaderState;
  return useFileIOShared({
    item: leader,
    replaceItem: replaceLeader,
    hasUnsavedChanges,
    markSaved,
    confirm,
    showPrompt,
    showStatus,
    toJson: leaderToJson,
    validateData: (data) => {
      const result = validateLeaderData(data);
      return result.valid ? { valid: true, item: result.leader } : result;
    },
    loadFromHandle: loadLeaderFromHandle,
    loadRecents,
    addToRecents,
    removeFromRecents,
    clearAllRecents,
    getName: (l) => l.crewLeaderName,
    defaultName: DEFAULT_CREW_LEADER_NAME,
    filenameFallback: "crew-leader",
    itemLabel: "crew leader",
    getRecentName: (entry) => entry.leaderName,
    handoffStorageKey: "trv-leader-handoff",
    handoffField: "leader",
    previewPath: "trv",
  });
}
