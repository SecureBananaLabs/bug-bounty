/**
 * @file formatBytes.js
 * Human-readable digital storage unit formatter with precision rounding.
 */

'use strict';

const SIZES = Object.freeze(['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']);

/**
 * Formats a numeric byte count into a human-readable string using base-1024 binary units.
 *
 * @param {number|string} bytes - Number of bytes to format.
 * @param {number} [decimals=2] - Number of decimal digits to retain.
 * @returns {string} Human-readable byte representation (e.g. "1.5 MB").
 */
export function formatBytes(bytes, decimals = 2) {
  const num = Number(bytes);

  if (isNaN(num) || !Number.isFinite(num) || num === 0) {
    return '0 B';
  }

  const isNegative = num < 0;
  const absBytes = Math.abs(num);
  const dm = typeof decimals === 'number' && decimals >= 0 ? Math.floor(decimals) : 2;

  const k = 1024;
  const i = Math.min(Math.floor(Math.log(absBytes) / Math.log(k)), SIZES.length - 1);

  if (i === 0) {
    return `${isNegative ? '-' : ''}${Math.round(absBytes)} ${SIZES[0]}`;
  }

  const value = absBytes / Math.pow(k, i);
  const formatted = parseFloat(value.toFixed(dm));

  return `${isNegative ? '-' : ''}${formatted} ${SIZES[i]}`;
}
