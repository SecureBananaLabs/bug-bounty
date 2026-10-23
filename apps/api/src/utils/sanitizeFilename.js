/**
 * Sanitizes an uploaded filename to prevent path traversal, control character injection,
 * and metadata overflow.
 *
 * Requirements (Issue #5859):
 * 1. Normalize uploaded filenames before returning them (Unicode NFC).
 * 2. Strip path separators (both POSIX '/' and Windows '\') and keep only the final segment.
 * 3. Remove control characters (ASCII 0x00-0x1F, 0x7F-0x9F) and trim surrounding whitespace.
 * 4. Cap returned filename length to a small metadata-safe size (default: 100 chars).
 * 5. Handle path traversal attempts (e.g., '..', '../secret.txt', '..\\secret.txt').
 *
 * @param {string} rawFilename - The input filename to sanitize
 * @param {object} [options={}] - Custom configuration options
 * @param {number} [options.maxLength=100] - Maximum allowable length of the sanitized filename
 * @param {string} [options.fallback='file'] - Fallback filename if sanitized result is empty
 * @param {boolean} [options.preserveExtension=true] - Whether to preserve file extension when truncating
 * @returns {string} - Sanitized, safe filename
 */
export function sanitizeFilename(rawFilename, options = {}) {
  const maxLength = typeof options.maxLength === "number" && options.maxLength > 0 ? options.maxLength : 100;
  const fallback = typeof options.fallback === "string" && options.fallback.length > 0 ? options.fallback : "file";
  const preserveExtension = options.preserveExtension !== false;

  if (rawFilename === null || rawFilename === undefined) {
    return fallback;
  }

  let name = String(rawFilename);

  // 1. Unicode NFC normalization
  try {
    name = name.normalize("NFC");
  } catch {
    // If normalize fails on exotic strings, proceed with raw string
  }

  // 2. Remove null bytes and control characters (ASCII 0x00-0x1F and 0x7F-0x9F)
  name = name.replace(/[\x00-\x1F\x7F-\x9F]/g, "");

  // 3. Strip Windows drive letters (e.g., 'C:\' or 'D:')
  name = name.replace(/^[a-zA-Z]:[/\\]*/, "");

  // 4. Split by path separators (/ and \) and extract the last non-empty segment
  const segments = name.split(/[/\\]+/).filter(Boolean);
  let segment = segments.length > 0 ? segments[segments.length - 1] : "";

  // 5. Trim surrounding whitespace
  segment = segment.trim();

  // 6. Prevent path traversal tokens: strip out single/double dot references or standalone dots
  if (segment === "." || segment === ".." || segment === "...") {
    segment = "";
  }

  // Remove unsafe filesystem characters (<, >, :, ", |, ?, *)
  segment = segment.replace(/[<>:"|?*]/g, "");

  // Trim trailing dots and whitespace (Windows filesystem safety)
  segment = segment.replace(/[.\s]+$/, "");

  // If segment is empty after sanitization, return fallback
  if (!segment) {
    return fallback;
  }

  // 7. Cap length to metadata-safe size
  if (segment.length > maxLength) {
    if (preserveExtension) {
      const lastDotIndex = segment.lastIndexOf(".");
      // If dot exists and is not the very first character and extension is reasonably sized
      if (lastDotIndex > 0 && lastDotIndex < segment.length - 1) {
        const ext = segment.slice(lastDotIndex);
        if (ext.length < maxLength) {
          const allowedBaseLength = maxLength - ext.length;
          const base = segment.slice(0, allowedBaseLength);
          segment = base + ext;
        } else {
          segment = segment.slice(0, maxLength);
        }
      } else {
        segment = segment.slice(0, maxLength);
      }
    } else {
      segment = segment.slice(0, maxLength);
    }
  }

  return segment || fallback;
}

/**
 * Validates whether a given filename is already sanitized and metadata-safe.
 *
 * @param {string} filename - Filename to check
 * @param {number} [maxLength=100] - Max allowable length
 * @returns {boolean} - True if filename is safe
 */
export function isValidFilename(filename, maxLength = 100) {
  if (typeof filename !== "string" || filename.length === 0 || filename.length > maxLength) {
    return false;
  }
  // Check for control characters
  if (/[\x00-\x1F\x7F-\x9F]/.test(filename)) {
    return false;
  }
  // Check for path separators or unsafe filesystem chars
  if (/[/\\<>:"|?*]/.test(filename)) {
    return false;
  }
  // Check for path traversal tokens
  if (filename === "." || filename === ".." || filename.startsWith("../") || filename.startsWith("..\\")) {
    return false;
  }
  return true;
}
