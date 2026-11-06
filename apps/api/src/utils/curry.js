const PLACEHOLDER = Symbol('curry.placeholder');

/**
 * Creates a curried function that receives arguments piece-meal until the expected
 * arity is satisfied, supporting placeholder tokens, custom arity bounds, exception
 * propagation, and dynamic context binding.
 *
 * Implements defenses against:
 * - CWE-1287: Improper type validation (strict function & integer arity validation)
 * - CWE-400: Stack exhaustion / infinite recursion via bounded arity cap
 * - CWE-755: Exception swallowing (transparently rethrows errors from target fn)
 * - Context loss: Preserves dynamic `this` across curried invocation chain
 * - Placeholder starvation: Left-to-right placeholder resolution with branching immutability
 *
 * @template {(...args: any[]) => any} T
 * @param {T} fn - The target function to curry.
 * @param {number} [arity] - Expected parameter count (defaults to fn.length).
 * @returns {any} Returns the curried function.
 */
export function curry(fn, arity) {
  if (typeof fn !== 'function') {
    throw new TypeError(`[curry] Expected first argument to be a function, received ${fn === null ? 'null' : typeof fn}`);
  }

  let targetArity;
  if (arity !== undefined) {
    const num = Number(arity);
    if (!Number.isFinite(num) || !Number.isInteger(num) || num < 0) {
      throw new TypeError(`[curry] Expected arity to be a non-negative integer, received ${arity}`);
    }
    if (num > 1000) {
      throw new RangeError(`[curry] Arity cannot exceed safe limit 1000, received ${arity}`);
    }
    targetArity = num;
  } else {
    targetArity = Math.max(0, Number.isInteger(fn.length) ? fn.length : 0);
  }

  function isPlaceholder(val) {
    return val === PLACEHOLDER || val === curry._ || val === curry.placeholder;
  }

  function combine(prevArgs, newArgs) {
    const result = [...prevArgs];
    let newIdx = 0;

    for (let i = 0; i < result.length && newIdx < newArgs.length; i++) {
      if (isPlaceholder(result[i])) {
        result[i] = newArgs[newIdx++];
      }
    }

    while (newIdx < newArgs.length) {
      result.push(newArgs[newIdx++]);
    }

    return result;
  }

  function hasRemainingPlaceholders(args, count) {
    const limit = Math.min(args.length, count);
    for (let i = 0; i < limit; i++) {
      if (isPlaceholder(args[i])) return true;
    }
    return false;
  }

  function countActualArgs(args, count) {
    let actual = 0;
    const limit = Math.min(args.length, count);
    for (let i = 0; i < limit; i++) {
      if (!isPlaceholder(args[i])) actual++;
    }
    return actual;
  }

  function makeCurried(accumulatedArgs, boundContext) {
    function curried(...args) {
      const activeContext = (this !== undefined && this !== globalThis) ? this : boundContext;
      const combinedArgs = combine(accumulatedArgs, args);

      const satisfied = (combinedArgs.length >= targetArity) && !hasRemainingPlaceholders(combinedArgs, targetArity);

      if (satisfied) {
        return fn.apply(activeContext, combinedArgs);
      }

      return makeCurried(combinedArgs, activeContext);
    }

    Object.defineProperty(curried, 'arity', {
      value: targetArity,
      writable: false,
      configurable: true
    });

    Object.defineProperty(curried, 'length', {
      value: Math.max(0, targetArity - countActualArgs(accumulatedArgs, targetArity)),
      writable: false,
      configurable: true
    });

    curried._ = PLACEHOLDER;
    curried.placeholder = PLACEHOLDER;

    return curried;
  }

  return makeCurried([], undefined);
}

curry._ = PLACEHOLDER;
curry.placeholder = PLACEHOLDER;

export default curry;
