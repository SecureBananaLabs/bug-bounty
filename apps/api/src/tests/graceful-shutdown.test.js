import test from "node:test";
import assert from "node:assert/strict";
import { createGracefulShutdown } from "../gracefulShutdown.js";

function silentLogger() {
  return { log() {}, error() {} };
}

test("graceful shutdown closes the server and exits successfully", () => {
  let closeCalls = 0;
  let exitCode;
  let clearedTimer;
  const timer = { unref() {} };
  const server = {
    close(callback) {
      closeCalls += 1;
      callback();
    }
  };

  const shutdown = createGracefulShutdown({
    server,
    exit(code) { exitCode = code; },
    setTimer() { return timer; },
    clearTimer(value) { clearedTimer = value; },
    logger: silentLogger()
  });

  shutdown("SIGTERM");

  assert.equal(closeCalls, 1);
  assert.equal(exitCode, 0);
  assert.equal(clearedTimer, timer);
});

test("graceful shutdown ignores duplicate signals", () => {
  let closeCalls = 0;
  const server = {
    close() {
      closeCalls += 1;
    }
  };

  const shutdown = createGracefulShutdown({
    server,
    exit() {},
    setTimer() { return { unref() {} }; },
    clearTimer() {},
    logger: silentLogger()
  });

  shutdown("SIGTERM");
  shutdown("SIGINT");

  assert.equal(closeCalls, 1);
});

test("graceful shutdown force-exits when the timeout expires", () => {
  let timeoutCallback;
  let exitCode;
  const server = { close() {} };

  const shutdown = createGracefulShutdown({
    server,
    timeoutMs: 25,
    exit(code) { exitCode = code; },
    setTimer(callback) {
      timeoutCallback = callback;
      return { unref() {} };
    },
    clearTimer() {},
    logger: silentLogger()
  });

  shutdown("SIGTERM");
  timeoutCallback();

  assert.equal(exitCode, 1);
});