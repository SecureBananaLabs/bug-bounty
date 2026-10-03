/**
 * @file retryWithBackoff.js
 * Resilient asynchronous retry utility with exponential backoff, full/equal jitter, and AbortSignal support.
 */

'use strict';

export function calculateBackoff(attempt, options = {}) {
  const initialDelayMs = options.initialDelayMs ?? 100;
  const maxDelayMs = options.maxDelayMs ?? 5000;
  const backoffFactor = options.backoffFactor ?? 2;
  const jitter = options.jitter ?? true;

  const rawDelay = Math.min(
    maxDelayMs,
    initialDelayMs * Math.pow(backoffFactor, Math.max(0, attempt - 1))
  );

  if (jitter === false || jitter === 'none') {
    return rawDelay;
  }

  if (jitter === 'equal') {
    const half = rawDelay / 2;
    return half + Math.random() * half;
  }

  return Math.random() * rawDelay;
}

export async function retryWithBackoff(fn, options = {}) {
  if (typeof fn !== 'function') {
    throw new TypeError('First argument fn must be a function');
  }

  const maxRetries = options.maxRetries ?? 3;
  const retryOn = options.retryOn ?? (() => true);
  const signal = options.signal;

  let attempt = 0;

  while (true) {
    if (signal && signal.aborted) {
      const abortError = signal.reason || new Error('Operation aborted');
      if (typeof abortError === 'object') {
        abortError.name = 'AbortError';
      }
      throw abortError;
    }

    try {
      return await fn();
    } catch (err) {
      attempt++;

      if (attempt > maxRetries || !retryOn(err)) {
        throw err;
      }

      if (signal && signal.aborted) {
        const abortError = signal.reason || new Error('Operation aborted');
        if (typeof abortError === 'object') {
          abortError.name = 'AbortError';
        }
        throw abortError;
      }

      const delayMs = calculateBackoff(attempt, options);

      if (typeof options.onRetry === 'function') {
        options.onRetry({ error: err, attempt, delayMs });
      }

      await new Promise((resolve, reject) => {
        let timer = null;

        const onAbort = () => {
          if (timer) clearTimeout(timer);
          const abortError = signal.reason || new Error('Operation aborted');
          if (typeof abortError === 'object') {
            abortError.name = 'AbortError';
          }
          reject(abortError);
        };

        if (signal) {
          signal.addEventListener('abort', onAbort, { once: true });
        }

        timer = setTimeout(() => {
          if (signal) {
            signal.removeEventListener('abort', onAbort);
          }
          resolve();
        }, delayMs);
      });
    }
  }
}