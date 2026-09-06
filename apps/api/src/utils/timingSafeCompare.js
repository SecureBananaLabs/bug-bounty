import crypto from 'node:crypto';

/**
 * Constant-time comparison between two strings or buffers to mitigate timing attacks.
 * @param {string | Buffer} a - First input
 * @param {string | Buffer} b - Second input
 * @returns {boolean} True if inputs are identical
 */
export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' && !Buffer.isBuffer(a)) return false;
  if (typeof b !== 'string' && !Buffer.isBuffer(b)) return false;

  const bufA = Buffer.isBuffer(a) ? a : Buffer.from(String(a), 'utf8');
  const bufB = Buffer.isBuffer(b) ? b : Buffer.from(String(b), 'utf8');

  // Hash both buffers with sha256 to ensure identical fixed length comparison
  const hashA = crypto.createHash('sha256').update(bufA).digest();
  const hashB = crypto.createHash('sha256').update(bufB).digest();

  return crypto.timingSafeEqual(hashA, hashB) && bufA.length === bufB.length;
}
