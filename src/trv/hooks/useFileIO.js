import { useState, useRef, useEffect } from "react";
import {
  leaderToJson,
  validateLeaderData,
  loadLeaderFromHandle,
  loadRecents,
  addToRecents,
  removeFromRecents,
  clearAllRecents,
} from "../utils/leaderIO";
import { sanitizeFilename, downloadBlob } from "../../shared/utils/filenames";

const writeToFileHandle = async (handle, json) => {
  const writable = await handle.createWritable();
  await writable.write(json);
  await writable.close();
};

export function useFileIO({ leaderState, confirm, showPrompt, showStatus }) {
  const { leader, replaceLeader, hasUnsavedChanges } = leaderState;
  const fileHandleRef = useRef(null);
  const [recents, setRecents] = useState([]);

  useEffect(() => {
    loadRecents().then(setRecents);
  }, []);

  const clearFileHandle = () => {
    fileHandleRef.current = null;
  };

  const applyLoaded = (handle, loadedLeader, statusMsg, addToRecentsFn) => {
    fileHandleRef.current = handle;
    replaceLeader(loadedLeader);
    showStatus(statusMsg);
    if (addToRecentsFn) addToRecentsFn();
  };

  const handleSaveJson = async () => {
    const json = leaderToJson(leader);
    const defaultName = sanitizeFilename(
      leader.crewLeaderName === "CREW LEADER" ? null : leader.crewLeaderName,
      "crew-leader",
    );

    if (fileHandleRef.current) {
      try {
        await writeToFileHandle(fileHandleRef.current, json);
        leaderState.markSaved(leader);
        showStatus(`Saved to ${fileHandleRef.current.name}`);
        setRecents(await addToRecents(fileHandleRef.current, leader));
        return;
      } catch {
        fileHandleRef.current = null;
      }
    }

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: `${defaultName}.json`,
          types: [
            {
              description: "JSON file",
              accept: { "application/json": [".json"] },
            },
          ],
        });
        await writeToFileHandle(handle, json);
        fileHandleRef.current = handle;
        leaderState.markSaved(leader);
        showStatus(`Saved to ${handle.name}`);
        setRecents(await addToRecents(handle, leader));
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    }

    // Fallback: legacy download
    const filename = await showPrompt({
      title: "Save Crew Leader",
      message: "File name:",
      defaultValue: defaultName,
    });
    if (!filename) return;
    const blob = new Blob([json], { type: "application/json" });
    downloadBlob(blob, filename.endsWith(".json") ? filename : `${filename}.json`);
    leaderState.markSaved(leader);
    showStatus("Crew leader saved to file");
  };

  const handleLoadJson = async () => {
    if (hasUnsavedChanges()) {
      const ok = await confirm({
        title: "Load Crew Leader",
        message: "Current unsaved changes will be lost.",
        confirmLabel: "Load",
        destructive: true,
      });
      if (!ok) return;
    }

    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [
            {
              description: "JSON file",
              accept: { "application/json": [".json"] },
            },
          ],
        });
        const file = await handle.getFile();
        const text = await file.text();
        const data = JSON.parse(text);
        const result = validateLeaderData(data);
        if (result.valid) {
          applyLoaded(handle, result.leader, `Loaded from ${handle.name}`, async () => {
            setRecents(await addToRecents(handle, result.leader));
          });
        } else {
          showStatus(result.error, "error");
        }
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
        if (err instanceof SyntaxError) {
          showStatus("Invalid JSON file", "error");
          return;
        }
      }
    }

    // Fallback: legacy file input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          const result = validateLeaderData(data);
          if (result.valid) {
            applyLoaded(null, result.leader, "Crew leader loaded from file");
          } else {
            showStatus(result.error, "error");
          }
        } catch {
          showStatus("Invalid JSON file", "error");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleLoadRecent = async (entry) => {
    if (hasUnsavedChanges()) {
      const ok = await confirm({
        title: "Load Crew Leader",
        message: `"${entry.leaderName || entry.fileName}" — current unsaved changes will be lost.`,
        confirmLabel: "Load",
        destructive: true,
      });
      if (!ok) return;
    }
    try {
      const data = await loadLeaderFromHandle(entry.handle);
      const result = validateLeaderData(data);
      if (result.valid) {
        applyLoaded(entry.handle, result.leader, `Loaded from ${entry.fileName}`, async () => {
          setRecents(await addToRecents(entry.handle, result.leader));
        });
      } else {
        showStatus(result.error, "error");
      }
    } catch {
      showStatus("File could not be found", "error");
      setRecents(await removeFromRecents(entry.id));
    }
  };

  const handleRemoveRecent = async (e, id) => {
    e.stopPropagation();
    setRecents(await removeFromRecents(id));
  };

  const handleOpenRecentInNewWindow = async (entry) => {
    try {
      const data = await loadLeaderFromHandle(entry.handle);
      const result = validateLeaderData(data);
      if (!result.valid) {
        showStatus(result.error, "error");
        return;
      }
      localStorage.setItem(
        "trv-leader-handoff",
        JSON.stringify({
          leader: result.leader,
          fileName: entry.fileName,
          timestamp: Date.now(),
        }),
      );
      const base = import.meta.env.BASE_URL || "/";
      const trvPath = base.endsWith("/") ? `${base}trv` : `${base}/trv`;
      const newWin = window.open(trvPath, "_blank");
      if (!newWin) {
        localStorage.removeItem("trv-leader-handoff");
        showStatus("Pop-up blocked — allow pop-ups for this site", "error");
      }
    } catch {
      showStatus(
        "Could not open file — it may have been moved or deleted",
        "error",
      );
      setRecents(await removeFromRecents(entry.id));
    }
  };

  const handleClearRecents = async () => {
    setRecents(await clearAllRecents());
  };

  return {
    clearFileHandle,
    recents,
    handleSaveJson,
    handleLoadJson,
    handleLoadRecent,
    handleRemoveRecent,
    handleOpenRecentInNewWindow,
    handleClearRecents,
  };
}
