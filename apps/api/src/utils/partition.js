/**
 * Split an array into two groups based on a predicate.
 * @param {Array} array - The array to partition
 * @param {Function} predicate - (item, index, array) => boolean
 * @returns {[Array, Array]} Tuple of [matches, nonMatches]
 */
export function partition(array, predicate) {
  if (!Array.isArray(array)) return [[], []];

  const matches = [];
  const nonMatches = [];

  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    if (predicate(item, i, array)) {
      matches.push(item);
    } else {
      nonMatches.push(item);
    }
  }

  return [matches, nonMatches];
}
