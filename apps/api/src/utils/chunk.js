/**
 * Creates an array of elements split into groups the length of `size`.
 *
 * Implements defenses against:
 * - Integer boundary clamping (floor, MAX_SAFE_INTEGER bounds)
 * - Non-positive, zero, Infinity, and NaN size defense
 * - Non-array and null/undefined input fallbacks
 * - Sparse array hole defense preventing Array.prototype pollution inheritance
 * - Optional skipHoles and strict validation modes
 *
 * @template T
 * @param {T[]} array - The array to process.
 * @param {number} [size=1] - The length of each chunk.
 * @param {object} [options={}] - Configuration options.
 * @param {boolean} [options.skipHoles=false] - Whether to skip sparse array holes instead of padding with undefined.
 * @param {boolean} [options.strict=false] - Whether to throw TypeError for invalid inputs instead of returning [].
 * @param {number} [options.maxChunks] - Maximum number of chunks to return.
 * @returns {T[][]} Returns the new array of chunks.
 */
export function chunk(array, size = 1, options = {}) {
  if (options !== undefined && (typeof options !== 'object' || options === null)) {
    throw new TypeError(`[chunk] Expected options to be an object, received ${options === null ? 'null' : typeof options}`);
  }

  const { skipHoles = false, strict = false, maxChunks } = options;

  if (!Array.isArray(array)) {
    if (strict) {
      throw new TypeError(`[chunk] Expected first argument to be an Array, received ${array === null ? 'null' : typeof array}`);
    }
    return [];
  }

  if (array.length === 0) {
    return [];
  }

  const numericSize = Number(size);
  if (!Number.isFinite(numericSize) || Number.isNaN(numericSize) || numericSize <= 0) {
    if (strict) {
      throw new TypeError(`[chunk] Expected size to be a positive finite number, received ${size}`);
    }
    return [];
  }

  // Integer boundary clamping
  const clampedSize = Math.min(
    Math.max(1, Math.floor(numericSize)),
    Number.MAX_SAFE_INTEGER
  );

  const length = array.length;
  const result = [];
  const limit = typeof maxChunks === 'number' && maxChunks > 0 ? Math.floor(maxChunks) : Infinity;

  let currentChunk = [];

  for (let i = 0; i < length; i++) {
    // Sparse array protection: verify own property to isolate against Array.prototype pollution
    const hasOwn = Object.prototype.hasOwnProperty.call(array, i);

    if (!hasOwn) {
      if (skipHoles) {
        continue;
      }
      currentChunk.push(undefined);
    } else {
      currentChunk.push(array[i]);
    }

    if (currentChunk.length === clampedSize) {
      result.push(currentChunk);
      currentChunk = [];
      if (result.length >= limit) {
        break;
      }
    }
  }

  if (currentChunk.length > 0 && result.length < limit) {
    result.push(currentChunk);
  }

  return result;
}

export default chunk;
