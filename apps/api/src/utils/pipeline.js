function assertAllFunctions(builderName, fns) {
  fns.forEach((fn, index) => {
    if (typeof fn !== "function") {
      const received = fn === null ? "null" : typeof fn;
      throw new TypeError(
        `${builderName}: expected all arguments to be functions, but argument at index ${index} is ${received}`
      );
    }
  });
}

export function pipe(...fns) {
  assertAllFunctions("pipe", fns);

  if (fns.length === 0) {
    return (input) => input;
  }

  const [first, ...rest] = fns;
  return (...args) => rest.reduce((result, fn) => fn(result), first(...args));
}

export function compose(...fns) {
  assertAllFunctions("compose", fns);

  if (fns.length === 0) {
    return (input) => input;
  }

  const [first, ...rest] = [...fns].reverse();
  return (...args) => rest.reduce((result, fn) => fn(result), first(...args));
}

export function pipeAsync(...fns) {
  assertAllFunctions("pipeAsync", fns);

  if (fns.length === 0) {
    return async (input) => input;
  }

  const [first, ...rest] = fns;
  return async (...args) => {
    let result = await first(...args);
    for (const fn of rest) {
      result = await fn(result);
    }
    return result;
  };
}

export function composeAsync(...fns) {
  assertAllFunctions("composeAsync", fns);

  if (fns.length === 0) {
    return async (input) => input;
  }

  const [first, ...rest] = [...fns].reverse();
  return async (...args) => {
    let result = await first(...args);
    for (const fn of rest) {
      result = await fn(result);
    }
    return result;
  };
}
