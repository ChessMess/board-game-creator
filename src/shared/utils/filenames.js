// Filename sanitization and blob download utilities.

export const sanitizeFilename = (name, fallback = "subject") => {
  if (!name) return fallback;
  const sanitized = name
    .trim()
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
  return sanitized || fallback;
};

export const downloadBlob = (blob, filename) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};
