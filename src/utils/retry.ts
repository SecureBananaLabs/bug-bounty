import type { Abortable } from 'events';

interface RetryOptions extends Abortable {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
  randomize?: boolean;
  maxDelay?: number;
}

const DEFAULTS: Required<RetryOptions> = {
  retries: 3,
  factor: 2,
  minTimeout: 1000,
  maxTimeout: 30000,
  randomize: true,
  maxDelay: 60000,
};

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Operation aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => resolve(), ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Operation aborted', 'AbortError'));
    }, { once: true });
  });
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULTS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (opts.retries === 0 || attempt === opts.retries) break;
      if (opts.signal?.aborted) {
        throw new DOMException('Operation aborted', 'AbortError');
      }
      const baseDelay = Math.min(
        opts.minTimeout * Math.pow(opts.factor, attempt),
        opts.maxDelay,
      );
      const delay = opts.randomize
        ? baseDelay * (0.5 + Math.random() * 0.5)
        : baseDelay;
      const cappedDelay = Math.min(delay, opts.maxTimeout);
      await sleep(cappedDelay, opts.signal);
    }
  }

  throw lastError;
}

export type { RetryOptions };
