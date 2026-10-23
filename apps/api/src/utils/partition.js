/**
 * Splits an array into two groups: elements that satisfy the predicate
 * and elements that do not.
 *
 * @template T
 * @param {T[]} array - Input collection to partition
 * @param {((item: T, index: number, array: T[]) => boolean) | string} [predicate=Boolean] - Evaluator function or property key
 * @returns {[T[], T[]]} Tuple of [matches, nonMatches]
 */
export function partition(array, predicate = Boolean) {
  if (!Array.isArray(array)) {
    return [[], []];
  }

  const evaluator =
    typeof predicate === 'function'
      ? predicate
      : typeof predicate === 'string'
      ? (item) => Boolean(item && item[predicate])
      : Boolean;

  const matches = [];
  const nonMatches = [];

  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    if (evaluator(item, i, array)) {
      matches.push(item);
    } else {
      nonMatches.push(item);
    }
  }

  return [matches, nonMatches];
}

export default partition;
