import crypto from "node:crypto";

/**
 * Performs a constant-time comparison between two strings or buffers
 * to mitigate timing-attack side-channels (CWE-208).
 *
 * @param {string|Buffer} a - First value to compare
 * @param {string|Buffer} b - Second value to compare
 * @returns {boolean} - True if both values are strictly equal, false otherwise
 */
export function timingSafeEqual(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) {
    return false;
  }

  const bufA = Buffer.isBuffer(a) ? a : Buffer.from(String(a), "utf8");
  const bufB = Buffer.isBuffer(b) ? b : Buffer.from(String(b), "utf8");

  // Constant-time hash digest comparison prevents length disclosure and timing leaks
  const hashA = crypto.createHash("sha256").update(bufA).digest();
  const hashB = crypto.createHash("sha256").update(bufB).digest();

  // Execute constant-time equality check across identical-length SHA-256 digests
  const isHashEqual = crypto.timingSafeEqual(hashA, hashB);
  return isHashEqual && bufA.length === bufB.length;
}
