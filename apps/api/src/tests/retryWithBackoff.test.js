import test from "node:test";
import assert from "node:assert/strict";

import { retryWithBackoff } from "../utils/retry.js";

test("retryWithBackoff resolves on the first successful attempt", async () => {
  let calls = 0;
  const result = await retryWithBackoff(
    async () => {
      calls += 1;
      return "ok";
    },
    { baseDelayMs: 1, maxDelayMs: 2 },
  );

  assert.equal(result, "ok");
  assert.equal(calls, 1);
});

test("retryWithBackoff retries transient failures and returns the first success", async () => {
  let calls = 0;
  const result = await retryWithBackoff(
    async () => {
      calls += 1;
      if (calls < 3) throw new Error("temporary");
      return calls;
    },
    { retries: 4, baseDelayMs: 1, maxDelayMs: 2 },
  );

  assert.equal(result, 3);
  assert.equal(calls, 3);
});

test("retryWithBackoff rethrows the last error once retries are exhausted", async () => {
  let calls = 0;
  await assert.rejects(
    () =>
      retryWithBackoff(
        async () => {
          calls += 1;
          throw new Error(`boom ${calls}`);
        },
        { retries: 2, baseDelayMs: 1, maxDelayMs: 2 },
      ),
    /boom 3/,
  );

  assert.equal(calls, 3);
});

test("retryWithBackoff stops early when the AbortSignal is already aborted", async () => {
  let calls = 0;
  const controller = new AbortController();
  controller.abort();

  await assert.rejects(
    () =>
      retryWithBackoff(
        async () => {
          calls += 1;
          return "ok";
        },
        { signal: controller.signal },
      ),
    /retry aborted/,
  );

  assert.equal(calls, 0);
});
