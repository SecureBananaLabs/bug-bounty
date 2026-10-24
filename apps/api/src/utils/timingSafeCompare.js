import crypto from 'crypto';

/**
 * Timing-safe string equality comparison using crypto.timingSafeEqual.
 * Normalizes input buffer lengths to prevent timing-attack side-channels.
 *
 * @param {string|Buffer} a
 * @param {string|Buffer} b
 * @returns {boolean} True if inputs are byte-for-byte identical.
 */
export function timingSafeEqual(a, b) {
  if (a == null || b == null) {
    return false;
  }

  const bufA = Buffer.isBuffer(a) ? a : Buffer.from(String(a));
  const bufB = Buffer.isBuffer(b) ? b : Buffer.from(String(b));

  if (bufA.length !== bufB.length) {
    const paddedB = Buffer.alloc(bufA.length);
    bufB.copy(paddedB, 0, 0, Math.min(bufB.length, bufA.length));
    crypto.timingSafeEqual(bufA, paddedB);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

export default timingSafeEqual;
