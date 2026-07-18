import { useState, useRef, useEffect } from "react";
import {
  heroToJson,
  validateHeroData,
  loadHeroFromHandle,
  loadRecents,
  addToRecents,
  removeFromRecents,
  clearAllRecents,
} from "../utils/heroIO";
import { sanitizeFilename, downloadBlob } from "../../shared/utils/filenames";

const writeToFileHandle = async (handle, json) => {
  const writable = await handle.createWritable();
  await writable.write(json);
  await writable.close();
};

export function useFileIO({ heroState, confirm, showPrompt, showStatus }) {
  const { hero, replaceHero, hasUnsavedChanges } = heroState;
  const fileHandleRef = useRef(null);
  const [recents, setRecents] = useState([]);

  useEffect(() => {
    loadRecents().then(setRecents);
  }, []);

  const clearFileHandle = () => {
    fileHandleRef.current = null;
  };

  const applyLoaded = (handle, loadedHero, statusMsg, addToRecentsFn) => {
    fileHandleRef.current = handle;
    replaceHero(loadedHero);
    showStatus(statusMsg);
    if (addToRecentsFn) addToRecentsFn();
  };

  const handleSaveJson = async () => {
    const json = heroToJson(hero);
    const defaultName = sanitizeFilename(
      hero.name === "HERO NAME" ? null : hero.name,
      "hero",
    );

    if (fileHandleRef.current) {
      try {
        await writeToFileHandle(fileHandleRef.current, json);
        heroState.markSaved(hero);
        showStatus(`Saved to ${fileHandleRef.current.name}`);
        setRecents(await addToRecents(fileHandleRef.current, hero));
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
        heroState.markSaved(hero);
        showStatus(`Saved to ${handle.name}`);
        setRecents(await addToRecents(handle, hero));
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    }

    // Fallback: legacy download
    const filename = await showPrompt({
      title: "Save Hero",
      message: "File name:",
      defaultValue: defaultName,
    });
    if (!filename) return;
    const blob = new Blob([json], { type: "application/json" });
    downloadBlob(blob, filename.endsWith(".json") ? filename : `${filename}.json`);
    heroState.markSaved(hero);
    showStatus("Hero saved to file");
  };

  const handleLoadJson = async () => {
    if (hasUnsavedChanges()) {
      const ok = await confirm({
        title: "Load Hero",
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
        const result = validateHeroData(data);
        if (result.valid) {
          applyLoaded(handle, result.hero, `Loaded from ${handle.name}`, async () => {
            setRecents(await addToRecents(handle, result.hero));
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
          const result = validateHeroData(data);
          if (result.valid) {
            applyLoaded(null, result.hero, "Hero loaded from file");
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
      await navigator.clipboard.writeText(heroToJson(hero));
      showStatus("Hero copied to clipboard");
    } catch {
      showStatus("Copy failed — check browser permissions", "error");
    }
  };

  // Returns true on success so the caller can close the paste modal
  const handlePasteSubmit = async (text) => {
    if (hasUnsavedChanges()) {
      const ok = await confirm({
        title: "Load Pasted Hero",
        message: "Current unsaved changes will be lost.",
        confirmLabel: "Load",
        destructive: true,
      });
      if (!ok) return false;
    }
    try {
      const data = JSON.parse(text);
      const result = validateHeroData(data);
      if (result.valid) {
        applyLoaded(null, result.hero, "Hero pasted successfully");
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
        title: "Load Hero",
        message: `"${entry.heroName || entry.fileName}" — current unsaved changes will be lost.`,
        confirmLabel: "Load",
        destructive: true,
      });
      if (!ok) return;
    }
    try {
      const data = await loadHeroFromHandle(entry.handle);
      const result = validateHeroData(data);
      if (result.valid) {
        applyLoaded(entry.handle, result.hero, `Loaded from ${entry.fileName}`, async () => {
          setRecents(await addToRecents(entry.handle, result.hero));
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
      const data = await loadHeroFromHandle(entry.handle);
      const result = validateHeroData(data);
      if (!result.valid) {
        showStatus(result.error, "error");
        return;
      }
      localStorage.setItem(
        "rtdt-hero-handoff",
        JSON.stringify({
          hero: result.hero,
          fileName: entry.fileName,
          timestamp: Date.now(),
        }),
      );
      const newWin = window.open(import.meta.env.BASE_URL || "/", "_blank");
      if (!newWin) {
        localStorage.removeItem("rtdt-hero-handoff");
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
