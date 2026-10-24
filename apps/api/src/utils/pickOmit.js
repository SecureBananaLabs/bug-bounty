/**
 * Defensively picks specified keys from an object.
 * Ignores prototype properties and non-plain-object inputs.
 *
 * @param {Object} obj - Source object.
 * @param {string[]|string} keys - Keys to pick.
 * @returns {Object} Filtered object with only picked keys.
 */
export function pick(obj, keys) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return {};
  }
  const keyList = Array.isArray(keys) ? keys : [keys];
  const result = {};
  for (const k of keyList) {
    if (typeof k === 'string' && Object.prototype.hasOwnProperty.call(obj, k)) {
      result[k] = obj[k];
    }
  }
  return result;
}

/**
 * Defensively omits specified keys from an object.
 * Ignores prototype properties and non-plain-object inputs.
 *
 * @param {Object} obj - Source object.
 * @param {string[]|string} keys - Keys to omit.
 * @returns {Object} Filtered object with specified keys excluded.
 */
export function omit(obj, keys) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return {};
  }
  const keyList = Array.isArray(keys) ? keys : [keys];
  const omitSet = new Set(keyList.filter(k => typeof k === 'string'));
  const result = {};
  for (const k of Object.keys(obj)) {
    if (!omitSet.has(k) && Object.prototype.hasOwnProperty.call(obj, k)) {
      result[k] = obj[k];
    }
  }
  return result;
}

export default { pick, omit };
