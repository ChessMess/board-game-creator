import { useState, useEffect } from "react";
import { getCurrentUser, isAdmin } from "../utils/firebaseCore";
import { sanitizeFilename, downloadBlob } from "../utils/filenames";
import GalleryCard from "./GalleryCard";

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function GalleryModal({
  onClose,
  onLoad,
  confirm,
  title,
  itemLabel,
  itemLabelPlural,
  shortLabel = itemLabel,
  shortLabelPlural = itemLabelPlural,
  fetchApproved,
  deleteApproved,
  deleteOwn,
  validateData,
  toJson,
  getName,
  defaultName,
  filenameFallback,
  renderMeta,
  renderTag,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [currentUid, setCurrentUid] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchApproved()
      .then((data) => {
        if (!cancelled) setItems(data);
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
      isAdmin().then((ok) => {
        if (!cancelled) setAdmin(ok);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [fetchApproved]);

  const handleLoad = (item) => {
    const result = validateData(item);
    if (result.valid) {
      onLoad(result.item);
      onClose();
    }
  };

  const handleDownload = (item) => {
    const json = toJson(item);
    const blob = new Blob([json], { type: "application/json" });
    downloadBlob(blob, `${sanitizeFilename(getName(item), filenameFallback)}.json`);
  };

  const handleDelete = async (item) => {
    const ok = await confirm({
      title: `Delete ${capitalize(shortLabel)}`,
      message: `Delete "${getName(item)}" from the gallery? This cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteApproved(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveOwn = async (item) => {
    const ok = await confirm({
      title: `Remove ${capitalize(shortLabel)}`,
      message: `Remove your ${shortLabel} "${getName(item)}" from the gallery?`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteOwn(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
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
            {title}
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
              <div className="text-gray-500 text-sm">
                Loading {itemLabelPlural}...
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-16">
              <div className="text-red-400 text-sm">
                Failed to load gallery: {error}
              </div>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <p className="text-sm">No {itemLabelPlural} shared yet.</p>
              <p className="text-xs mt-1">
                Be the first to share a {itemLabel} to the gallery!
              </p>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.map((item) => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  name={getName(item) || defaultName}
                  itemLabel={shortLabel}
                  metaLine={renderMeta(item)}
                  tagLine={renderTag(item)}
                  onLoad={handleLoad}
                  onDownload={handleDownload}
                  onDelete={admin ? handleDelete : null}
                  onRemoveOwn={
                    !admin && currentUid && item.submittedBy === currentUid
                      ? handleRemoveOwn
                      : null
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-700 shrink-0 flex items-center justify-between">
          <span className="text-[10px] text-gray-500">
            {items.length}{" "}
            {items.length !== 1 ? shortLabelPlural : shortLabel} shared
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
