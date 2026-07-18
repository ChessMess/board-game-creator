import { useState, useRef, useCallback, useEffect } from "react";
import { svgElementToPngBlob } from "../utils/svgRaster";
import { getEmbeddedFontCSS } from "../utils/embeddedFonts";

// Increase for higher-res clipboard/download output (e.g. 3 = 3×, 1 = native)
const SNAPSHOT_SCALE = 2;

const sanitizeFilename = (name, fallback = "subject") => {
  if (!name) return fallback;
  const sanitized = name
    .trim()
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
  return sanitized || fallback;
};

const renderBoardPngBlob = async ({ svgSelector, boardW, boardH, fontSetKey }) => {
  const svgEl = document.querySelector(svgSelector);
  if (!svgEl) throw new Error(`No SVG element found at "${svgSelector}"`);

  // Embed fonts so text renders in the real board fonts, not fallbacks — an
  // SVG loaded through <img> is an isolated document the page's @font-face
  // rules do not reach.
  const fontCSS = fontSetKey ? await getEmbeddedFontCSS(fontSetKey) : "";

  return svgElementToPngBlob(svgEl, {
    width: boardW,
    height: boardH,
    scale: SNAPSHOT_SCALE,
    fontCSS,
  });
};

const copyBlobToClipboard = async (blob) => {
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
};

const downloadBlob = (blob, filename) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};

const captureSnapshot = async (
  name,
  {
    svgSelector,
    boardW,
    boardH,
    download = false,
    filenameFallback = "subject",
    fontSetKey,
  } = {},
) => {
  const pngBlob = await renderBoardPngBlob({
    svgSelector,
    boardW,
    boardH,
    fontSetKey,
  });
  const filename = `${sanitizeFilename(name, filenameFallback)}.png`;
  let copied = false;
  try {
    await copyBlobToClipboard(pngBlob);
    copied = true;
  } catch {
    if (!download) downloadBlob(pngBlob, filename);
  }
  if (download) downloadBlob(pngBlob, filename);
  return { copied, filename };
};

export function useSnapshot({
  subjectName,
  svgSelector,
  boardW,
  boardH,
  filenameFallback = "subject",
  fontSetKey,
  showStatus,
}) {
  const [snapshotFlash, setSnapshotFlash] = useState(false);
  const [holding, setHolding] = useState(false);
  const holdTimerRef = useRef(null);
  const holdEligibleRef = useRef(false);
  const holdBusyRef = useRef(false);
  const subjectNameRef = useRef(subjectName);
  const showStatusRef = useRef(showStatus);

  useEffect(() => {
    subjectNameRef.current = subjectName;
  }, [subjectName]);

  useEffect(() => {
    showStatusRef.current = showStatus;
  }, [showStatus]);

  const cancelHold = useCallback(() => {
    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
    holdEligibleRef.current = false;
    setHolding(false);
  }, []);

  const onSnapshotPointerDown = useCallback((e) => {
    if (holdBusyRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    holdEligibleRef.current = false;
    holdTimerRef.current = setTimeout(() => {
      holdEligibleRef.current = true;
      setHolding(true);
    }, 3000);
  }, []);

  const onSnapshotPointerUp = useCallback(() => {
    if (holdBusyRef.current) return;
    const wasEligible = holdEligibleRef.current;
    cancelHold();
    holdBusyRef.current = true;
    captureSnapshot(subjectNameRef.current, {
      svgSelector,
      boardW,
      boardH,
      download: wasEligible,
      filenameFallback,
      fontSetKey,
    })
      .then(({ copied }) => {
        setSnapshotFlash(true);
        setTimeout(() => setSnapshotFlash(false), 600);
        showStatusRef.current(
          wasEligible
            ? copied
              ? "Copied & downloaded"
              : "Downloaded as PNG (clipboard unavailable)"
            : copied
              ? "Image copied to clipboard"
              : "Downloaded as PNG (clipboard unavailable)",
        );
      })
      .catch((err) => {
        console.error("Snapshot failed:", err);
        showStatusRef.current("Snapshot failed", "error");
      })
      .finally(() => {
        holdBusyRef.current = false;
      });
  }, [cancelHold, svgSelector, boardW, boardH, filenameFallback, fontSetKey]);

  useEffect(() => {
    window.addEventListener("blur", cancelHold);
    return () => window.removeEventListener("blur", cancelHold);
  }, [cancelHold]);

  return {
    snapshotFlash,
    holding,
    onSnapshotPointerDown,
    onSnapshotPointerUp,
    cancelHold,
  };
}
