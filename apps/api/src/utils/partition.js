/**
 * Splits an array into two groups: those that satisfy predicate and those that do not.
 * @template T
 * @param {T[]} array - Input array
 * @param {(item: T, index: number, array: T[]) => boolean} predicate - Evaluator function
 * @returns {[T[], T[]]} Tuple of [matches, nonMatches]
 */
export function partition(array, predicate) {
  if (!Array.isArray(array)) {
    return [[], []];
  }

  const fn = typeof predicate === 'function' ? predicate : Boolean;
  const matches = [];
  const nonMatches = [];

  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    if (fn(item, i, array)) {
      matches.push(item);
    } else {
      nonMatches.push(item);
    }
  }

  return [matches, nonMatches];
}
