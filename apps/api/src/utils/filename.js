export const MAX_FILENAME_LENGTH = 120;

export function sanitizeFilename(originalName) {
  if (typeof originalName !== "string") {
    return null;
  }

  // Keep only the final segment so path separators cannot leak into the response.
  const segments = originalName.split(/[/\\]/);
  const basename = segments[segments.length - 1] ?? "";

  // Drop control characters and trim surrounding whitespace.
  const cleaned = basename
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, MAX_FILENAME_LENGTH);

  return cleaned.length > 0 ? cleaned : null;
}
