/**
 * Converts a byte count into a human-readable string with units (B, KB, MB, GB, TB, PB).
 *
 * Requirements (Issue #11876, #11877, #743):
 * 1. Base 1024 calculation for binary storage scaling.
 * 2. Units: ['B', 'KB', 'MB', 'GB', 'TB', 'PB'].
 * 3. Configurable decimal precision (default: 2).
 * 4. Fail-safe formatting: Returns "0 B" for negative, non-numeric, null, undefined, or NaN inputs.
 * 5. Safely parses numeric strings.
 * 6. Supports decimal units, preserves trailing zeros when requested, and handles rollover gracefully.
 *
 * @param {number|string} bytes - The number of bytes to format
 * @param {number|object} [decimalsOrOptions=2] - Number of decimal places or options object
 * @param {object} [options={}] - Options if decimals was passed as a number
 * @returns {string} - Formatted human-readable string (e.g., '1.5 MB')
 */
export function formatBytes(bytes, decimalsOrOptions = 2, options = {}) {
  let decimals = 2;
  let config = {};

  if (typeof decimalsOrOptions === "object" && decimalsOrOptions !== null) {
    config = decimalsOrOptions;
    if (typeof config.decimals === "number") {
      decimals = config.decimals;
    }
  } else if (typeof decimalsOrOptions === "number") {
    decimals = decimalsOrOptions;
    config = options || {};
  }

  // Ensure decimals is non-negative integer
  const dm = decimals < 0 ? 0 : Math.floor(decimals);

  // Validate and parse input
  if (bytes === null || bytes === undefined || bytes === "" || typeof bytes === "boolean") {
    return "0 B";
  }

  const num = Number(bytes);

  // Fail-safe formatting for NaN, non-finite, or negative values
  if (!Number.isFinite(num) || num <= 0) {
    return "0 B";
  }

  const k = 1024;
  const sizes = config.units || ["B", "KB", "MB", "GB", "TB", "PB"];

  // Index calculation with lower bound protection for sub-unit fractional bytes (e.g. 0.5)
  let i = num < 1 ? 0 : Math.min(Math.floor(Math.log(num) / Math.log(k)), sizes.length - 1);

  let rawVal = num / Math.pow(k, i);

  // Prevent rounding overflow (e.g., 1023.999 KB formatted with 0 decimals should rollover to 1 MB)
  const rounded = Number(rawVal.toFixed(dm));
  if (rounded >= k && i < sizes.length - 1) {
    i += 1;
    rawVal = num / Math.pow(k, i);
  }

  // parseFloat(...toFixed(dm)) removes redundant trailing zeros (e.g., 1.50 -> 1.5)
  // unless preserveTrailingZeros option is explicitly set
  const formattedVal = config.preserveTrailingZeros
    ? rawVal.toFixed(dm)
    : parseFloat(rawVal.toFixed(dm)).toString();

  const separator = config.separator !== undefined ? config.separator : " ";

  return `${formattedVal}${separator}${sizes[i]}`;
}

/**
 * Parses a human-readable byte string (e.g. '1.5 MB', '500 KB', '10 KiB') back into integer bytes.
 *
 * @param {string} str - Formatted string to parse
 * @returns {number} - Number of bytes, or 0 if invalid
 */
export function parseBytes(str) {
  if (typeof str !== "string" || !str.trim()) {
    return 0;
  }

  const trimmed = str.trim();
  const match = trimmed.match(/^([\d.]+)\s*([a-zA-Z]+)?$/);
  if (!match) {
    return 0;
  }

  const value = parseFloat(match[1]);
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  const unit = (match[2] || "B").toUpperCase();
  const multipliers = {
    B: 1,
    BYTES: 1,
    KB: 1024,
    KIB: 1024,
    K: 1024,
    MB: 1024 * 1024,
    MIB: 1024 * 1024,
    M: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    GIB: 1024 * 1024 * 1024,
    G: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
    TIB: 1024 * 1024 * 1024 * 1024,
    T: 1024 * 1024 * 1024 * 1024,
    PB: 1024 * 1024 * 1024 * 1024 * 1024,
    PIB: 1024 * 1024 * 1024 * 1024 * 1024,
    P: 1024 * 1024 * 1024 * 1024 * 1024
  };

  const multiplier = multipliers[unit];
  if (!multiplier) {
    return 0;
  }

  return Math.round(value * multiplier);
}
