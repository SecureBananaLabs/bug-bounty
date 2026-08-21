import crypto from "node:crypto";

/**
 * Compares two strings or buffers in constant time to prevent timing side-channel attacks.
 * Automatically handles strings of different lengths by hashing them with SHA-256 before comparison.
 *
 * @param {string | Buffer} a - First string or buffer
 * @param {string | Buffer} b - Second string or buffer
 * @returns {boolean} True if both values are identical, false otherwise
 */
export function timingSafeEqual(a, b) {
  if (typeof a !== "string" && !Buffer.isBuffer(a)) {
    return false;
  }
  if (typeof b !== "string" && !Buffer.isBuffer(b)) {
    return false;
  }

  // Convert strings to Buffers
  const bufA = typeof a === "string" ? Buffer.from(a, "utf-8") : a;
  const bufB = typeof b === "string" ? Buffer.from(b, "utf-8") : b;

  // Hash both buffers with SHA-256 to ensure identical byte lengths for crypto.timingSafeEqual
  const hashA = crypto.createHash("sha256").update(bufA).digest();
  const hashB = crypto.createHash("sha256").update(bufB).digest();

  return crypto.timingSafeEqual(hashA, hashB) && bufA.length === bufB.length;
}

export default timingSafeEqual;
