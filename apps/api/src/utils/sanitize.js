// Sanitize a user-supplied filename for safe echo in API responses and storage.
// - Strips path components (basename only).
// - Replaces any character outside [A-Za-z0-9._-] with '_'.
// - Collapses runs of '_'.
// - Truncates to 255 chars total.
// - Returns 'file' as a safe fallback when nothing usable remains.
export function sanitizeFilename(name, fallback = "file", maxLen = 255) {
  if (typeof name !== "string" || name.length === 0) return fallback;
  // Take basename only (handles both / and \ as path separators).
  const basename = name
    .replace(/\\/g, "/")
    .split("/")
    .pop();
  const cleaned = basename
    // Remove control characters first.
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f]/g, "")
    // Replace anything outside the safe set with underscore.
    .replace(/[^A-Za-z0-9._-]/g, "_")
    // Collapse runs of underscores to a single underscore.
    .replace(/_+/g, "_")
    // Strip leading/trailing dots, underscores, and dashes.
    .replace(/^[._-]+|[._-]+$/g, "");
  if (cleaned.length === 0) return fallback;
  if (cleaned.length <= maxLen) return cleaned;
  // Preserve extension when truncating.
  const dotIndex = cleaned.lastIndexOf(".");
  if (dotIndex > 0 && cleaned.length - dotIndex <= 16) {
    const ext = cleaned.slice(dotIndex);
    const stem = cleaned.slice(0, maxLen - ext.length);
    return stem + ext;
  }
  return cleaned.slice(0, maxLen);
}
