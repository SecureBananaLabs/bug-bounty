const MAX_SIZE = Number.MAX_SAFE_INTEGER;

export function chunk(array, size, options = {}) {
  const { strict = false, skipHoles = false, maxChunks } = options;

  if (!Array.isArray(array)) {
    if (strict) {
      throw new TypeError("chunk: expected an array");
    }
    return [];
  }

  const numericSize = Number(size);
  if (Number.isNaN(numericSize)) {
    return [];
  }
  const sanitizedSize = Math.floor(numericSize);
  if (sanitizedSize <= 0) {
    return [];
  }
  const clampedSize = Math.min(Math.max(sanitizedSize, 1), MAX_SIZE);

  const hasMaxChunks = Number.isFinite(maxChunks) && maxChunks >= 0;
  const chunkLimit = hasMaxChunks ? Math.floor(maxChunks) : Infinity;
  if (chunkLimit === 0) {
    return [];
  }

  const result = [];
  for (let start = 0; start < array.length; start += clampedSize) {
    const end = Math.min(start + clampedSize, array.length);
    const slice = [];
    for (let index = start; index < end; index += 1) {
      if (skipHoles && !Object.hasOwn(array, index)) {
        continue;
      }
      slice.push(Object.hasOwn(array, index) ? array[index] : undefined);
    }
    result.push(slice);
    if (result.length >= chunkLimit) {
      break;
    }
  }

  return result;
}

export default chunk;
