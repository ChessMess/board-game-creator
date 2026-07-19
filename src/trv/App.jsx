import { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import { svgToCanvas } from "./utils/svgToPdfCanvas";
import { ensureFontsLoaded, TRV_FONT_SPECS } from "../shared/utils/fontReady";
import { warmBoardAssets } from "../shared/utils/svgRaster";
import { getEmbeddedFontCSS } from "../shared/utils/embeddedFonts";
import CrewLeaderBoard from "./components/CrewLeaderBoard";
import CrewLeaderForm from "./components/CrewLeaderForm";
import FieldHandles from "./components/FieldHandles";
import { useFieldEditor } from "./hooks/useFieldEditor";
import GalleryModal from "./components/GalleryModal";
import AdminPanel from "./components/AdminPanel";
import { validateLeaderData } from "./utils/leaderIO";
import { useLeaderState } from "./hooks/useLeaderState";
import { useFileIO } from "./hooks/useFileIO";
import { useGallery } from "./hooks/useGallery";
import { useConfirm } from "../shared/hooks/useConfirm";
import ConfirmDialog from "../shared/components/ConfirmDialog";
import { formatTimeAgo } from "../shared/utils/timeUtils";
import AppRouteSwitch from "../shared/components/AppRouteSwitch";
import { useSnapshot } from "../shared/hooks/useSnapshot";
import SidebarHeader from "../shared/components/SidebarHeader";
import StatusMessage from "../shared/components/StatusMessage";
import RecentsList from "../shared/components/RecentsList";
import RecentRow from "../shared/components/RecentRow";
import ZoomControls from "../shared/components/ZoomControls";
import SnapshotButton from "../shared/components/SnapshotButton";
import SidebarToggleButton from "../shared/components/SidebarToggleButton";
import DesignerCredit from "../shared/components/DesignerCredit";
import { sanitizeFilename as sanitizeFilenameBase } from "../shared/utils/filenames";

const sanitizeFilename = (name) =>
  sanitizeFilenameBase(name === "CREW LEADER" ? null : name, "crew-leader");

export default function TrvApp() {
  const leaderState = useLeaderState();
  const {
    leader,
    updateLeader,
    updateSlot,
    updateFieldStyle,
    resetFieldStyle,
    clearAllFieldStyles,
    isModifiedFromDefault,
  } = leaderState;
  const {
    confirmState,
    confirm,
    showAlert,
    showPrompt,
    handleConfirm,
    handleCancel,
  } = useConfirm();

  const [sidebarOpen, setSidebarOpen] = useState(
    () => localStorage.getItem("trv-sidebarOpen") !== "false",
  );
  const [statusMsg, setStatusMsg] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [zoom, setZoom] = useState(1);
  const boardAreaRef = useRef(null);
  const pasteTextareaRef = useRef(null);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });

  const BOARD_W = 1027.3709;
  const BOARD_H = 789.92139;
  const ASPECT = BOARD_W / BOARD_H;

  const editor = useFieldEditor({
    svgSelector: "#trv-board-container svg",
    leader,
    updateFieldStyle,
  });

  const showStatus = (text, type = "success") => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const fileIO = useFileIO({ leaderState, confirm, showPrompt, showStatus });
  const {
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
  } = fileIO;

  const {
    submitting,
    shareWarning,
    setShareWarning,
    handleShareToGallery,
    handleLoadFromGallery,
  } = useGallery({ leaderState, clearFileHandle, confirm, showAlert, showStatus });

  const {
    snapshotFlash,
    holding,
    onSnapshotPointerDown,
    onSnapshotPointerUp,
    cancelHold,
  } = useSnapshot({
    subjectName: leader.crewLeaderName,
    svgSelector: "#trv-board-container svg",
    boardW: BOARD_W,
    boardH: BOARD_H,
    filenameFallback: "crew-leader",
    fontSetKey: "trv",
    showStatus,
  });

  useEffect(() => {
    localStorage.setItem("trv-sidebarOpen", sidebarOpen);
  }, [sidebarOpen]);

  // Warm export assets at mount so the first PDF/snapshot is a cache hit rather
  // than a cold multi-MB decode on the click path (fixes Safari first-export).
  useEffect(() => {
    getEmbeddedFontCSS("trv");
    ensureFontsLoaded(TRV_FONT_SPECS);
    warmBoardAssets({
      svgSelector: "#trv-board-container svg",
      width: BOARD_W,
      height: BOARD_H,
      scale: 3,
    });
  }, []);

  useEffect(() => {
    const el = boardAreaRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      let w = width;
      let h = w / ASPECT;
      if (h > height) {
        h = height;
        w = h * ASPECT;
      }
      setBoardSize({ width: w, height: h });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ASPECT]);

  // Detect handoff from "Open in new tab"
  useEffect(() => {
    try {
      const raw = localStorage.getItem("trv-leader-handoff");
      if (!raw) return;
      const handoff = JSON.parse(raw);
      localStorage.removeItem("trv-leader-handoff");
      if (Date.now() - handoff.timestamp > 10_000) return;
      if (handoff.leader) {
        const result = validateLeaderData(handoff.leader);
        if (!result.valid) return;
        clearFileHandle();
        leaderState.replaceLeader(result.leader);
        showStatus(`Opened ${handoff.fileName || "crew leader"} in new tab`);
      }
    } catch {
      localStorage.removeItem("trv-leader-handoff");
    }
  }, []);

  const resetLeader = async () => {
    if (isModifiedFromDefault()) {
      const ok = await confirm({
        title: "Reset Crew Leader",
        message: "You have unsaved changes that will be lost. Reset anyway?",
        confirmLabel: "Reset",
        destructive: true,
      });
      if (!ok) return;
    }
    clearFileHandle();
    leaderState.resetLeader();
    showStatus("Reset to defaults");
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const svgEl = document.querySelector("#trv-board-container svg");
      if (!svgEl) throw new Error("Board SVG not found");

      // Block on fonts so measurement/rasterization uses real glyph metrics.
      await ensureFontsLoaded(TRV_FONT_SPECS);

      const pdfCanvas = await svgToCanvas(svgEl, BOARD_W, BOARD_H, 3);

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [BOARD_W, BOARD_H],
      });
      doc.addImage(
        pdfCanvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        BOARD_W,
        BOARD_H,
      );

      doc.save(`${sanitizeFilename(leader.crewLeaderName)}-crew-leader.pdf`);
      showStatus("PDF downloaded");
    } catch (err) {
      console.error("PDF export failed:", err);
      showStatus("PDF export failed", "error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      {/* Editor panel */}
      <aside
        className={`flex flex-col bg-gray-800 border-r border-gray-700 overflow-hidden transition-all duration-300 ${sidebarOpen ? "w-80" : "w-0 border-r-0"}`}
      >
        <SidebarHeader
          title="Crew Leader Creator"
          subtitle="Thunder Road Vendetta"
          onReset={resetLeader}
          onAdminClick={() => setShowAdmin(true)}
        />

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <CrewLeaderForm
            leader={leader}
            updateLeader={updateLeader}
            updateSlot={updateSlot}
            updateFieldStyle={updateFieldStyle}
            resetFieldStyle={resetFieldStyle}
            clearAllFieldStyles={clearAllFieldStyles}
          />
        </div>

        <div className="px-4 py-3 border-t border-gray-700 bg-gray-900 shrink-0 space-y-2">
          <StatusMessage message={statusMsg} />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleSaveJson}
              className="rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs py-1.5 uppercase tracking-wider transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleLoadJson}
              className="rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs py-1.5 uppercase tracking-wider transition-colors"
            >
              Load
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyToClipboard}
              className="rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs py-1.5 uppercase tracking-wider transition-colors"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={() => setShowPasteModal(true)}
              className="rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs py-1.5 uppercase tracking-wider transition-colors"
            >
              Paste
            </button>
          </div>
          {recents.length > 0 && (
            <RecentsList label="Recent Leaders" onClearAll={handleClearRecents}>
              {recents.map((entry) => (
                <RecentRow
                  key={entry.id}
                  entry={entry}
                  title={entry.leaderName}
                  countLabel={`${entry.slotCount} slots`}
                  onLoad={handleLoadRecent}
                  onRemove={handleRemoveRecent}
                  onOpenNewWindow={handleOpenRecentInNewWindow}
                  formatTimeAgo={formatTimeAgo}
                />
              ))}
            </RecentsList>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGalleryOpen(true)}
              className="rounded bg-indigo-800 hover:bg-indigo-700 text-indigo-200 text-xs py-1.5 uppercase tracking-wider transition-colors"
            >
              Gallery
            </button>
            <button
              type="button"
              onClick={handleShareToGallery}
              disabled={submitting}
              className="rounded bg-indigo-800 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-indigo-200 text-xs py-1.5 uppercase tracking-wider transition-colors"
            >
              {submitting ? "Sharing…" : "Share"}
            </button>
          </div>
          {shareWarning && (
            <div className="bg-yellow-900/30 border border-yellow-700/50 rounded p-2 space-y-1">
              <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">
                Before sharing:
              </p>
              {shareWarning.map((issue, i) => (
                <p key={i} className="text-[10px] text-yellow-300">
                  • {issue}
                </p>
              ))}
              <button
                type="button"
                onClick={() => setShareWarning(null)}
                className="text-[10px] text-gray-400 hover:text-gray-200 underline"
              >
                Dismiss
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="w-full rounded bg-amber-700 hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-2.5 text-sm uppercase tracking-widest transition-colors"
          >
            {downloading ? "Generating PDF…" : "Download PDF"}
          </button>
        </div>
      </aside>

      {/* Preview panel */}
      <main className="flex-1 flex flex-col bg-gray-950 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 shrink-0">
          <div className="flex items-center gap-3">
            <SidebarToggleButton open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />
            {!sidebarOpen && <AppRouteSwitch />}
            <DesignerCredit label="Designed by" name={leader.author_name} revision={leader.revision_no} />
          </div>

          <div className="flex items-center gap-2">
            <ZoomControls zoom={zoom} onZoom={setZoom} />

            <SnapshotButton
              onPointerDown={onSnapshotPointerDown}
              onPointerUp={onSnapshotPointerUp}
              onPointerLeave={cancelHold}
              onPointerCancel={cancelHold}
              disabled={downloading}
              holding={holding}
              flash={snapshotFlash}
            />
          </div>
        </div>

        {/* Board area */}
        <div
          ref={boardAreaRef}
          className="flex-1 overflow-auto grid justify-items-center items-start px-8 pt-2 pb-8"
        >
          <div
            id="trv-board-container"
            className="shadow-2xl"
            onPointerDown={editor.onBoardPointerDown}
            style={{
              width: boardSize.width * zoom,
              height: boardSize.height * zoom,
              touchAction: "none",
              cursor: "pointer",
            }}
          >
            <CrewLeaderBoard leader={leader} />
          </div>
        </div>
      </main>

      <FieldHandles
        selectedId={editor.selectedId}
        leader={leader}
        zoom={zoom}
        svgSelector="#trv-board-container svg"
        editor={editor}
      />

      {galleryOpen && (
        <GalleryModal
          onClose={() => setGalleryOpen(false)}
          onLoadLeader={handleLoadFromGallery}
          confirm={confirm}
        />
      )}

      {showAdmin && (
        <AdminPanel onClose={() => setShowAdmin(false)} confirm={confirm} />
      )}

      {showPasteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 w-96 space-y-3">
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
              Paste Crew Leader JSON
            </h2>
            <textarea
              ref={pasteTextareaRef}
              rows={10}
              placeholder="Paste crew leader JSON here..."
              autoFocus
              className="w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-xs text-gray-100 font-mono focus:outline-none focus:border-amber-500 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs px-4 py-1.5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await handlePasteSubmit(
                    pasteTextareaRef.current.value,
                  );
                  if (ok) setShowPasteModal(false);
                }}
                className="rounded bg-amber-700 hover:bg-amber-600 text-white text-xs px-4 py-1.5 font-bold transition-colors"
              >
                Load
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmState && (
        <ConfirmDialog
          confirmState={confirmState}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
