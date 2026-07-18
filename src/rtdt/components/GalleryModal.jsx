import { useState, useEffect } from "react";
import { fetchApprovedHeroes, deleteApprovedHero, deleteOwnHero, isAdmin, getCurrentUser } from "../utils/firebase";
import { validateHeroData, heroToJson } from "../utils/heroIO";
import { sanitizeFilename, downloadBlob } from "../../shared/utils/filenames";
import GalleryCard from "./GalleryCard";

export default function GalleryModal({ onClose, onLoadHero, confirm }) {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [currentUid, setCurrentUid] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchApprovedHeroes()
      .then((data) => {
        if (!cancelled) setHeroes(data);
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

  const handleLoad = (hero) => {
    const result = validateHeroData(hero);
    if (result.valid) {
      onLoadHero(result.hero);
      onClose();
    }
  };

  const handleDownload = (hero) => {
    const json = heroToJson(hero);
    const blob = new Blob([json], { type: "application/json" });
    downloadBlob(blob, `${sanitizeFilename(hero.name, "hero")}.json`);
  };

  const handleDelete = async (hero) => {
    const ok = await confirm({
      title: "Delete Hero",
      message: `Delete "${hero.name}" from the gallery? This cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteApprovedHero(hero.id);
      setHeroes((prev) => prev.filter((h) => h.id !== hero.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveOwn = async (hero) => {
    const ok = await confirm({
      title: "Remove Hero",
      message: `Remove your hero "${hero.name}" from the gallery?`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteOwnHero(hero.id);
      setHeroes((prev) => prev.filter((h) => h.id !== hero.id));
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
            Community Hero Gallery
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
              <div className="text-gray-500 text-sm">Loading heroes...</div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-16">
              <div className="text-red-400 text-sm">
                Failed to load gallery: {error}
              </div>
            </div>
          )}

          {!loading && !error && heroes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <p className="text-sm">No heroes shared yet.</p>
              <p className="text-xs mt-1">
                Be the first to share a hero to the gallery!
              </p>
            </div>
          )}

          {!loading && !error && heroes.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {heroes.map((hero) => (
                <GalleryCard
                  key={hero.id}
                  hero={hero}
                  onLoad={handleLoad}
                  onDownload={handleDownload}
                  onDelete={admin ? handleDelete : null}
                  onRemoveOwn={!admin && currentUid && hero.submittedBy === currentUid ? handleRemoveOwn : null}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-700 shrink-0 flex items-center justify-between">
          <span className="text-[10px] text-gray-500">
            {heroes.length} hero{heroes.length !== 1 ? "es" : ""} shared
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
