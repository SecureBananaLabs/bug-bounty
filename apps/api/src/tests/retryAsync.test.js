import test from "node:test";
import assert from "node:assert/strict";
import { retryAsync } from "../utils/retryAsync.js";

function failTimes(times, finalValue) {
  let calls = 0;
  return async (attempt) => {
    calls += 1;
    if (calls <= times) {
      throw new Error(`fail-${calls}`);
    }
    return { finalValue, attempt, calls };
  };
}

test("resolves immediately when fn succeeds on the first attempt", async () => {
  let calls = 0;
  const result = await retryAsync(async () => {
    calls += 1;
    return "ok";
  });

  assert.equal(result, "ok");
  assert.equal(calls, 1);
});

test("retries on failure and resolves once fn succeeds within budget", async () => {
  const fn = failTimes(2, "recovered");
  const result = await retryAsync(fn, { delay: 1 });

  assert.deepEqual(result, { finalValue: "recovered", attempt: 3, calls: 3 });
});

test("supports synchronous functions that throw", async () => {
  let calls = 0;
  const fn = () => {
    calls += 1;
    if (calls < 3) {
      throw new Error(`sync-fail-${calls}`);
    }
    return "sync-ok";
  };

  const result = await retryAsync(fn, { delay: 1 });
  assert.equal(result, "sync-ok");
  assert.equal(calls, 3);
});

test("supports synchronous functions returning non-promise values", async () => {
  const result = await retryAsync(() => 42);
  assert.equal(result, 42);
});

test("propagates the terminal error once the retry budget is exhausted", async () => {
  let calls = 0;
  const fn = async () => {
    calls += 1;
    throw new Error(`always-fails-${calls}`);
  };

  await assert.rejects(
    retryAsync(fn, { retries: 2, delay: 1 }),
    (err) => {
      assert.equal(err.message, "always-fails-3");
      return true;
    }
  );
  assert.equal(calls, 3);
});

test("defaults to 3 retries (4 total attempts) when retries is not specified", async () => {
  let calls = 0;
  const fn = async () => {
    calls += 1;
    throw new Error("boom");
  };

  await assert.rejects(retryAsync(fn, { delay: 1 }));
  assert.equal(calls, 4);
});

test("honors shouldRetry to stop retrying early even with budget remaining", async () => {
  let calls = 0;
  const fn = async () => {
    calls += 1;
    throw new Error(calls === 1 ? "retryable" : "fatal");
  };

  await assert.rejects(
    retryAsync(fn, {
      retries: 5,
      delay: 1,
      shouldRetry: (err) => err.message === "retryable",
    }),
    (err) => {
      assert.equal(err.message, "fatal");
      return true;
    }
  );
  assert.equal(calls, 2);
});

test("invokes onRetry with the error, attempt number, and next delay", async () => {
  const fn = failTimes(2, "done");
  const calls = [];

  await retryAsync(fn, {
    delay: 10,
    backoff: 2,
    onRetry: (err, attempt, nextDelay) => {
      calls.push({ message: err.message, attempt, nextDelay });
    },
  });

  assert.deepEqual(calls, [
    { message: "fail-1", attempt: 1, nextDelay: 10 },
    { message: "fail-2", attempt: 2, nextDelay: 20 },
  ]);
});

test("applies exponential backoff and caps at maxDelay", async () => {
  const fn = failTimes(4, "done");
  const delays = [];

  await retryAsync(fn, {
    retries: 4,
    delay: 10,
    backoff: 3,
    maxDelay: 50,
    onRetry: (_err, _attempt, nextDelay) => {
      delays.push(nextDelay);
    },
  });

  assert.deepEqual(delays, [10, 30, 50, 50]);
});

test("does not call onRetry when fn succeeds on the first attempt", async () => {
  let onRetryCalls = 0;
  await retryAsync(async () => "ok", {
    onRetry: () => {
      onRetryCalls += 1;
    },
  });

  assert.equal(onRetryCalls, 0);
});

test("rejects when fn is not a function", async () => {
  await assert.rejects(retryAsync(null), TypeError);
  await assert.rejects(retryAsync("not-a-function"), TypeError);
});

test("rejects on invalid options", async () => {
  await assert.rejects(retryAsync(async () => {}, { retries: -1 }), TypeError);
  await assert.rejects(retryAsync(async () => {}, { retries: 1.5 }), TypeError);
  await assert.rejects(retryAsync(async () => {}, { delay: -5 }), TypeError);
  await assert.rejects(retryAsync(async () => {}, { backoff: -1 }), TypeError);
  await assert.rejects(retryAsync(async () => {}, { maxDelay: -1 }), TypeError);
  await assert.rejects(retryAsync(async () => {}, { shouldRetry: "nope" }), TypeError);
  await assert.rejects(retryAsync(async () => {}, { onRetry: "nope" }), TypeError);
  await assert.rejects(retryAsync(async () => {}, "nope"), TypeError);
});

test("passes the current attempt number to fn", async () => {
  const seenAttempts = [];
  const fn = async (attempt) => {
    seenAttempts.push(attempt);
    if (attempt < 3) {
      throw new Error("retry-me");
    }
    return "ok";
  };

  await retryAsync(fn, { delay: 1 });
  assert.deepEqual(seenAttempts, [1, 2, 3]);
});
