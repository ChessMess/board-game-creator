import { useState, useRef, useEffect } from "react";
import { sanitizeFilename, downloadBlob } from "../utils/filenames";

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const titleCase = (s) => s.split(" ").map(capitalize).join(" ");

const writeToFileHandle = async (handle, json) => {
  const writable = await handle.createWritable();
  await writable.write(json);
  await writable.close();
};

export function useFileIO({
  item,
  replaceItem,
  hasUnsavedChanges,
  markSaved,
  confirm,
  showPrompt,
  showStatus,
  toJson,
  validateData,
  loadFromHandle,
  loadRecents,
  addToRecents,
  removeFromRecents,
  clearAllRecents,
  getName,
  defaultName,
  filenameFallback,
  itemLabel,
  getRecentName,
  handoffStorageKey,
  handoffField,
  previewPath,
}) {
  const fileHandleRef = useRef(null);
  const [recents, setRecents] = useState([]);

  useEffect(() => {
    loadRecents().then(setRecents);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFileHandle = () => {
    fileHandleRef.current = null;
  };

  const applyLoaded = (handle, loadedItem, statusMsg, addToRecentsFn) => {
    fileHandleRef.current = handle;
    replaceItem(loadedItem);
    showStatus(statusMsg);
    if (addToRecentsFn) addToRecentsFn();
  };

  const handleSaveJson = async () => {
    const json = toJson(item);
    const defaultFilename = sanitizeFilename(
      getName(item) === defaultName ? null : getName(item),
      filenameFallback,
    );

    if (fileHandleRef.current) {
      try {
        await writeToFileHandle(fileHandleRef.current, json);
        markSaved(item);
        showStatus(`Saved to ${fileHandleRef.current.name}`);
        setRecents(await addToRecents(fileHandleRef.current, item));
        return;
      } catch {
        fileHandleRef.current = null;
      }
    }

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: `${defaultFilename}.json`,
          types: [
            {
              description: "JSON file",
              accept: { "application/json": [".json"] },
            },
          ],
        });
        await writeToFileHandle(handle, json);
        fileHandleRef.current = handle;
        markSaved(item);
        showStatus(`Saved to ${handle.name}`);
        setRecents(await addToRecents(handle, item));
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    }

    // Fallback: legacy download
    const filename = await showPrompt({
      title: `Save ${titleCase(itemLabel)}`,
      message: "File name:",
      defaultValue: defaultFilename,
    });
    if (!filename) return;
    const blob = new Blob([json], { type: "application/json" });
    downloadBlob(blob, filename.endsWith(".json") ? filename : `${filename}.json`);
    markSaved(item);
    showStatus(`${capitalize(itemLabel)} saved to file`);
  };

  const handleLoadJson = async () => {
    if (hasUnsavedChanges()) {
      const ok = await confirm({
        title: `Load ${titleCase(itemLabel)}`,
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
        const result = validateData(data);
        if (result.valid) {
          applyLoaded(handle, result.item, `Loaded from ${handle.name}`, async () => {
            setRecents(await addToRecents(handle, result.item));
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
          const result = validateData(data);
          if (result.valid) {
            applyLoaded(null, result.item, `${capitalize(itemLabel)} loaded from file`);
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

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(toJson(item));
      showStatus(`${capitalize(itemLabel)} copied to clipboard`);
    } catch {
      showStatus("Copy failed — check browser permissions", "error");
    }
  };

  // Returns true on success so the caller can close the paste modal
  const handlePasteSubmit = async (text) => {
    if (hasUnsavedChanges()) {
      const ok = await confirm({
        title: `Load Pasted ${titleCase(itemLabel)}`,
        message: "Current unsaved changes will be lost.",
        confirmLabel: "Load",
        destructive: true,
      });
      if (!ok) return false;
    }
    try {
      const data = JSON.parse(text);
      const result = validateData(data);
      if (result.valid) {
        applyLoaded(null, result.item, `${capitalize(itemLabel)} pasted successfully`);
        return true;
      } else {
        showStatus(result.error, "error");
      }
    } catch {
      showStatus("Invalid JSON — check the pasted text", "error");
    }
    return false;
  };

  const handleLoadRecent = async (entry) => {
    if (hasUnsavedChanges()) {
      const ok = await confirm({
        title: `Load ${titleCase(itemLabel)}`,
        message: `"${getRecentName(entry) || entry.fileName}" — current unsaved changes will be lost.`,
        confirmLabel: "Load",
        destructive: true,
      });
      if (!ok) return;
    }
    try {
      const data = await loadFromHandle(entry.handle);
      const result = validateData(data);
      if (result.valid) {
        applyLoaded(entry.handle, result.item, `Loaded from ${entry.fileName}`, async () => {
          setRecents(await addToRecents(entry.handle, result.item));
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
      const data = await loadFromHandle(entry.handle);
      const result = validateData(data);
      if (!result.valid) {
        showStatus(result.error, "error");
        return;
      }
      localStorage.setItem(
        handoffStorageKey,
        JSON.stringify({
          [handoffField]: result.item,
          fileName: entry.fileName,
          timestamp: Date.now(),
        }),
      );
      const base = import.meta.env.BASE_URL || "/";
      const newWin = window.open(`${base}${previewPath}`, "_blank");
      if (!newWin) {
        localStorage.removeItem(handoffStorageKey);
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
    handleCopyToClipboard,
    handlePasteSubmit,
    handleLoadRecent,
    handleRemoveRecent,
    handleOpenRecentInNewWindow,
    handleClearRecents,
  };
}
