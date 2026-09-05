const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];
const BASE = 1024;

/**
 * Format bytes into a human-readable string.
 * @param {number} bytes - The number of bytes
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted string (e.g. "1.5 MB")
 */
export function formatBytes(bytes, decimals = 2) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';

  if (bytes === 0) return '0 B';

  const i = Math.floor(Math.log(bytes) / Math.log(BASE));
  const index = Math.min(i, UNITS.length - 1);

  const value = bytes / Math.pow(BASE, index);
  // Don't show decimals for bytes
  if (index === 0) return `${Math.round(value)} ${UNITS[index]}`;
  return `${value.toFixed(decimals)} ${UNITS[index]}`;
}
