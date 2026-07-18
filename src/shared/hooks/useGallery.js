import { useState } from "react";

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function useGallery({
  item,
  replaceItem,
  hasUnsavedChanges,
  clearFileHandle,
  confirm,
  showAlert,
  showStatus,
  getShareIssues,
  submit,
  withdrawPending,
  isPendingHashValid,
  savePendingRef,
  getPendingRef,
  clearPendingRef,
  getName,
  getPriorName,
  itemLabel,
  shortLabel = itemLabel,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [shareWarning, setShareWarning] = useState(null);

  const handleShareToGallery = async () => {
    const issues = getShareIssues(item);
    if (issues.length > 0) {
      setShareWarning(issues);
      return;
    }
    const ok = await confirm({
      title: "Share to Gallery",
      message: `This ${itemLabel} will be reviewed before appearing in the community gallery.`,
      confirmLabel: "Share",
    });
    if (!ok) return;
    setSubmitting(true);
    try {
      let isReplacement = false;
      const prior = getPendingRef();
      if (prior) {
        const stillPending = await isPendingHashValid(prior.hash);
        if (!stillPending) {
          clearPendingRef();
        } else {
          const replace = await confirm({
            title: "Replace Pending Submission?",
            message: `You have a pending submission for "${getPriorName(prior)}" awaiting review. Replace it with this updated version?`,
            confirmLabel: "Replace",
            cancelLabel: "Cancel",
          });
          if (!replace) return;
          try {
            await withdrawPending(prior.hash);
          } catch {
            /* already gone */
          }
          clearPendingRef();
          isReplacement = true;
        }
      }
      const hash = await submit(item);
      savePendingRef(hash, getName(item));
      showStatus(
        isReplacement
          ? `${capitalize(shortLabel)} submission updated!`
          : `${capitalize(shortLabel)} submitted for review!`,
      );
    } catch (err) {
      console.error("Submit failed:", err);
      showAlert({ title: "Share Failed", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadFromGallery = async (galleryItem) => {
    if (hasUnsavedChanges()) {
      const ok = await confirm({
        title: `Load Gallery ${capitalize(shortLabel)}`,
        message: "Current unsaved changes will be lost.",
        confirmLabel: "Load",
        destructive: true,
      });
      if (!ok) return;
    }
    clearFileHandle();
    replaceItem(galleryItem);
    showStatus(`${capitalize(shortLabel)} loaded from gallery`);
  };

  return {
    submitting,
    shareWarning,
    setShareWarning,
    handleShareToGallery,
    handleLoadFromGallery,
  };
}
