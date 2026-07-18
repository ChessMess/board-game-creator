import { useState, useRef, useCallback } from "react";
import { loadLeader, saveLeader, clearLeaderStorage } from "../utils/leaderIO";
import { defaultCrewLeader } from "../data/defaultCrewLeader";

export function useLeaderState() {
  const initial = loadLeader();
  const [leader, setLeader] = useState(initial);
  const savedLeaderRef = useRef(JSON.stringify(initial));

  const markSaved = (l) => {
    savedLeaderRef.current = JSON.stringify(l);
  };

  const hasUnsavedChanges = () => {
    return JSON.stringify(leader) !== savedLeaderRef.current;
  };

  const updateLeader = useCallback((field, value) => {
    setLeader((prev) => {
      const next = { ...prev, [field]: value };
      saveLeader(next);
      return next;
    });
  }, []);

  const updateSlot = useCallback((slotIndex, field, value) => {
    setLeader((prev) => {
      const slots = [...prev.slots];
      slots[slotIndex] = { ...slots[slotIndex], [field]: value };
      const next = { ...prev, slots };
      saveLeader(next);
      return next;
    });
  }, []);

  // Per-field style/transform overrides. `patch` keys set to null/undefined are
  // dropped so the stored override stays sparse (empty override → removed).
  const updateFieldStyle = useCallback((fieldId, patch) => {
    setLeader((prev) => {
      const fieldStyles = { ...(prev.fieldStyles || {}) };
      const merged = { ...(fieldStyles[fieldId] || {}), ...patch };
      for (const k of Object.keys(merged)) {
        if (merged[k] === null || merged[k] === undefined) delete merged[k];
      }
      if (Object.keys(merged).length === 0) delete fieldStyles[fieldId];
      else fieldStyles[fieldId] = merged;
      const next = { ...prev, fieldStyles };
      saveLeader(next);
      return next;
    });
  }, []);

  const resetFieldStyle = useCallback((fieldId) => {
    setLeader((prev) => {
      if (!prev.fieldStyles || !prev.fieldStyles[fieldId]) return prev;
      const fieldStyles = { ...prev.fieldStyles };
      delete fieldStyles[fieldId];
      const next = { ...prev, fieldStyles };
      saveLeader(next);
      return next;
    });
  }, []);

  const clearAllFieldStyles = useCallback(() => {
    setLeader((prev) => {
      const next = { ...prev, fieldStyles: {} };
      saveLeader(next);
      return next;
    });
  }, []);

  const replaceLeader = (l) => {
    setLeader(l);
    saveLeader(l);
    markSaved(l);
  };

  const resetLeader = () => {
    clearLeaderStorage();
    const fresh = { ...defaultCrewLeader };
    setLeader(fresh);
    markSaved(fresh);
  };

  const isModifiedFromDefault = () =>
    JSON.stringify(leader) !== JSON.stringify(defaultCrewLeader);

  return {
    leader,
    setLeader,
    markSaved,
    hasUnsavedChanges,
    replaceLeader,
    updateLeader,
    updateSlot,
    updateFieldStyle,
    resetFieldStyle,
    clearAllFieldStyles,
    resetLeader,
    isModifiedFromDefault,
  };
}
