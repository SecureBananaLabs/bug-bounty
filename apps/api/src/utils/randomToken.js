import crypto from 'node:crypto';

const ALPHANUMERIC_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const SUPPORTED_ENCODINGS = new Set(['hex', 'base64', 'base64url']);

/**
 * Generates a cryptographically secure random token using Node's CSPRNG (`node:crypto`).
 * Supports standard encodings (`hex`, `base64`, `base64url`), `'alphanumeric'`,
 * or a custom character alphabet string.
 *
 * @param {number} [size=32] - Number of random bytes (or character length when using custom alphabet)
 * @param {'hex' | 'base64' | 'base64url' | 'alphanumeric' | { alphabet?: string, encoding?: string }} [options='hex'] - Encoding or custom options
 * @returns {string} Cryptographically random token
 */
export function generateSecureToken(size = 32, options = 'hex') {
  if (typeof size !== 'number' || !Number.isInteger(size) || size <= 0 || size > 4096) {
    throw new RangeError('Token size must be a positive integer between 1 and 4096');
  }

  if (options && typeof options === 'object' && typeof options.alphabet === 'string') {
    return generateFromAlphabet(size, options.alphabet);
  }

  const encoding =
    typeof options === 'string'
      ? options
      : options && typeof options === 'object' && typeof options.encoding === 'string'
      ? options.encoding
      : 'hex';

  if (encoding === 'alphanumeric') {
    return generateFromAlphabet(size, ALPHANUMERIC_ALPHABET);
  }

  if (SUPPORTED_ENCODINGS.has(encoding)) {
    return crypto.randomBytes(size).toString(/** @type {BufferEncoding} */ (encoding));
  }

  // If a custom alphabet string (> 1 unique chars) is passed directly as second argument
  if (typeof options === 'string' && options.length >= 2) {
    return generateFromAlphabet(size, options);
  }

  throw new TypeError(`Unsupported encoding or alphabet: ${String(options)}`);
}

/**
 * Generates an unbiased random string of length `length` from `alphabet`.
 *
 * @param {number} length
 * @param {string} alphabet
 * @returns {string}
 */
export function generateFromAlphabet(length, alphabet = ALPHANUMERIC_ALPHABET) {
  if (typeof alphabet !== 'string' || alphabet.length < 2) {
    throw new TypeError('Alphabet must be a string with at least 2 characters');
  }

  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return out;
}

export default generateSecureToken;
