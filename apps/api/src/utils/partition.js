const hasOwn = Object.prototype.hasOwnProperty;

export class PartitionError extends Error {
  constructor(index, cause) {
    super(`partition predicate threw while evaluating index ${index}`, { cause });
    this.name = "PartitionError";
    this.index = index;
  }
}

function evaluatePredicate(predicate, value, index, array, thisArg) {
  if (typeof predicate === "function") {
    return predicate.call(thisArg, value, index, array);
  }
  return Boolean(value?.[predicate]);
}

export function partition(array, predicate = Boolean, options = {}) {
  if (!Array.isArray(array)) {
    throw new TypeError(
      `partition expected an Array, received ${array === null ? "null" : typeof array}`
    );
  }

  if (
    typeof predicate !== "function" &&
    typeof predicate !== "string" &&
    typeof predicate !== "symbol"
  ) {
    throw new TypeError(
      `partition predicate must be a function, string, or symbol, received ${typeof predicate}`
    );
  }

  const { skipHoles = false, suppressErrors = false, onError, thisArg } = options ?? {};

  const truthy = [];
  const falsy = [];

  for (let index = 0; index < array.length; index++) {
    const isOwnIndex = hasOwn.call(array, index);

    if (!isOwnIndex && skipHoles) {
      continue;
    }

    const value = isOwnIndex ? array[index] : undefined;

    let outcome;
    try {
      outcome = evaluatePredicate(predicate, value, index, array, thisArg);
    } catch (error) {
      const wrapped = new PartitionError(index, error);
      if (typeof onError === "function") {
        outcome = onError(wrapped, value, index, array);
      } else if (suppressErrors) {
        outcome = false;
      } else {
        throw wrapped;
      }
    }

    (outcome ? truthy : falsy).push(value);
  }

  return [truthy, falsy];
}

export default partition;
