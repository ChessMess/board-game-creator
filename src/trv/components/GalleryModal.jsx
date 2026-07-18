import { useState, useEffect } from "react";
import { fetchApprovedLeaders, deleteApprovedLeader, deleteOwnLeader, isAdmin, getCurrentUser } from "../utils/firebase";
import { validateLeaderData, leaderToJson } from "../utils/leaderIO";
import { sanitizeFilename, downloadBlob } from "../../shared/utils/filenames";
import GalleryCard from "./GalleryCard";

export default function GalleryModal({ onClose, onLoadLeader, confirm }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [currentUid, setCurrentUid] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchApprovedLeaders()
      .then((data) => {
        if (!cancelled) setLeaders(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    const user = getCurrentUser();
    if (user) {
      setCurrentUid(user.uid);
      isAdmin().then((ok) => { if (!cancelled) setAdmin(ok); });
    }
    return () => { cancelled = true; };
  }, []);

  const handleLoad = (leader) => {
    const result = validateLeaderData(leader);
    if (result.valid) {
      onLoadLeader(result.leader);
      onClose();
    }
  };

  const handleDownload = (leader) => {
    const json = leaderToJson(leader);
    const blob = new Blob([json], { type: "application/json" });
    downloadBlob(blob, `${sanitizeFilename(leader.crewLeaderName, "crew-leader")}.json`);
  };

  const handleDelete = async (leader) => {
    const ok = await confirm({
      title: "Delete Leader",
      message: `Delete "${leader.crewLeaderName}" from the gallery? This cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteApprovedLeader(leader.id);
      setLeaders((prev) => prev.filter((l) => l.id !== leader.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveOwn = async (leader) => {
    const ok = await confirm({
      title: "Remove Leader",
      message: `Remove your leader "${leader.crewLeaderName}" from the gallery?`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteOwnLeader(leader.id);
      setLeaders((prev) => prev.filter((l) => l.id !== leader.id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-[90vw] max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700 shrink-0">
          <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest">
            Community Crew Leader Gallery
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-lg"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-gray-500 text-sm">Loading crew leaders...</div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-16">
              <div className="text-red-400 text-sm">
                Failed to load gallery: {error}
              </div>
            </div>
          )}

          {!loading && !error && leaders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <p className="text-sm">No crew leaders shared yet.</p>
              <p className="text-xs mt-1">
                Be the first to share a crew leader to the gallery!
              </p>
            </div>
          )}

          {!loading && !error && leaders.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {leaders.map((leader) => (
                <GalleryCard
                  key={leader.id}
                  leader={leader}
                  onLoad={handleLoad}
                  onDownload={handleDownload}
                  onDelete={admin ? handleDelete : null}
                  onRemoveOwn={!admin && currentUid && leader.submittedBy === currentUid ? handleRemoveOwn : null}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-700 shrink-0 flex items-center justify-between">
          <span className="text-[10px] text-gray-500">
            {leaders.length} leader{leaders.length !== 1 ? "s" : ""} shared
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs px-4 py-1.5 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
