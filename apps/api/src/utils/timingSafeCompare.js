/**
 * @file timingSafeCompare.js
 * Constant-time comparison utility for secrets, tokens, and cryptographic signatures.
 */

'use strict';

import crypto from 'crypto';

/**
 * Compares two strings or Buffers in constant time to prevent timing side-channel attacks.
 * Uses SHA-256 digest normalization to safely compare inputs of equal or different lengths
 * without throwing RangeErrors or leaking string lengths through early returns.
 *
 * @param {string|Buffer} a - First value (e.g. expected secret or token).
 * @param {string|Buffer} b - Second value (e.g. user-supplied secret or token).
 * @returns {boolean} True if values are identical, false otherwise.
 */
export function timingSafeEqual(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) {
    return false;
  }

  if (typeof a !== 'string' && !Buffer.isBuffer(a)) {
    return false;
  }

  if (typeof b !== 'string' && !Buffer.isBuffer(b)) {
    return false;
  }

  const bufA = Buffer.isBuffer(a) ? a : Buffer.from(String(a), 'utf8');
  const bufB = Buffer.isBuffer(b) ? b : Buffer.from(String(b), 'utf8');

  // Compute fixed-length SHA-256 digests
  const hashA = crypto.createHash('sha256').update(bufA).digest();
  const hashB = crypto.createHash('sha256').update(bufB).digest();

  // Compare digests in constant time
  const hashesMatch = crypto.timingSafeEqual(hashA, hashB);

  // Both the hashes must match and the original byte lengths must be identical
  return hashesMatch && bufA.length === bufB.length;
}

export const safeCompare = timingSafeEqual;
