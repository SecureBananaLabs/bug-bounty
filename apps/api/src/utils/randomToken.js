/**
 * @file randomToken.js
 * Cryptographically secure random token generation with multiple encodings and custom alphabet support.
 */

import crypto from 'crypto';

const DEFAULT_ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generates a cryptographically secure random token in the specified encoding.
 *
 * @param {number} [byteLength=32] - Number of random bytes of entropy to generate.
 * @param {'hex'|'base64'|'base64url'} [encoding='hex'] - Output encoding format.
 * @returns {string} The encoded random token.
 */
export function generateSecureToken(byteLength = 32, encoding = 'hex') {
  if (typeof byteLength !== 'number' || byteLength <= 0 || !Number.isInteger(byteLength)) {
    throw new RangeError(`Expected byteLength to be a positive integer, received ${byteLength}`);
  }

  const validEncodings = new Set(['hex', 'base64', 'base64url']);
  if (!validEncodings.has(encoding)) {
    throw new TypeError(`Invalid encoding "${encoding}". Supported encodings: hex, base64, base64url`);
  }

  const bytes = crypto.randomBytes(byteLength);

  if (encoding === 'base64url') {
    return bytes.toString('base64url');
  }

  return bytes.toString(encoding);
}

/**
 * Generates an unbiased random string of specific length using a custom character alphabet.
 *
 * @param {number} [length=32] - The length of the output string.
 * @param {string} [alphabet=DEFAULT_ALPHANUMERIC] - The character set to choose from.
 * @returns {string} The generated random token.
 */
export function generateCustomToken(length = 32, alphabet = DEFAULT_ALPHANUMERIC) {
  if (typeof length !== 'number' || length <= 0 || !Number.isInteger(length)) {
    throw new RangeError(`Expected length to be a positive integer, received ${length}`);
  }

  if (typeof alphabet !== 'string' || alphabet.length < 2) {
    throw new TypeError(`Alphabet must be a string with at least 2 characters`);
  }

  const alphabetLen = alphabet.length;
  // Use unbiased rejection sampling for uniform distribution
  const maxByte = 256 - (256 % alphabetLen);
  let result = '';

  while (result.length < length) {
    const randomBytes = crypto.randomBytes(Math.ceil((length - result.length) * 1.5));
    for (let i = 0; i < randomBytes.length && result.length < length; i++) {
      const byte = randomBytes[i];
      if (byte < maxByte) {
        result += alphabet[byte % alphabetLen];
      }
    }
  }

  return result;
}
