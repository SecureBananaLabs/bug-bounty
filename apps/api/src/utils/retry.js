const DEFAULTS = {
  retries: 3,
  baseDelayMs: 40,
  maxDelayMs: 1000,
};

function isAborted(signal) {
  return Boolean(signal && signal.aborted);
}

function sleep(ms, signal) {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (signal) signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new Error("retry aborted"));
    }
    if (signal) signal.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Call `fn` until it resolves, waiting with exponential backoff plus jitter
 * between attempts. Aborts as soon as the supplied AbortSignal is aborted.
 */
export async function retryWithBackoff(fn, options = {}) {
  const { retries, baseDelayMs, maxDelayMs, signal } = { ...DEFAULTS, ...options };

  if (typeof fn !== "function") {
    throw new TypeError("retryWithBackoff expects a function");
  }
  if (isAborted(signal)) throw new Error("retry aborted");

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      if (isAborted(signal)) throw new Error("retry aborted");
      const capped = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      // Full jitter keeps a floor of half the capped delay so retries still
      // spread out without ever becoming a fixed stampede.
      const jittered = capped / 2 + Math.random() * (capped / 2);
      await sleep(jittered, signal);
    }
  }
  throw lastError;
}
