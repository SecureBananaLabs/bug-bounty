import crypto from 'node:crypto';

/**
 * Generates a cryptographically secure random nonce / token.
 * Useful for CSP nonces, CSRF tokens, OAuth state parameters, and unique request identifiers.
 * 
 * @param {number} [byteLength=16] - Number of random bytes to generate (clamped between 4 and 256).
 * @param {'hex'|'base64url'} [encoding='hex'] - Output encoding.
 * @returns {string} Hex or base64url encoded nonce string.
 */
const VALID_ENCODINGS = new Set(['hex', 'base64url']);

export function generateNonce(byteLength = 16, encoding = 'hex') {
  let len = typeof byteLength === 'number' && Number.isFinite(byteLength) ? Math.floor(byteLength) : 16;
  if (len < 4) len = 4;
  if (len > 256) len = 256;

  const enc = typeof encoding === 'string' && VALID_ENCODINGS.has(encoding.toLowerCase())
    ? encoding.toLowerCase()
    : 'hex';

  const buffer = crypto.randomBytes(len);
  return buffer.toString(enc);
}

export default generateNonce;
