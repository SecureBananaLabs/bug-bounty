/**
 * Formats a byte size into human-readable representation.
 * @param {number | string} bytes - Raw byte count
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} Formatted byte string (e.g., '1.5 MB')
 */
export function formatBytes(bytes, decimals = 2) {
  const num = Number(bytes);
  if (!Number.isFinite(num) || num <= 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.min(Math.floor(Math.log(num) / Math.log(k)), sizes.length - 1);

  return `${parseFloat((num / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
