import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { installProcessErrorHandlers } from "../utils/processErrorHandlers.js";

function createProcessHarness() {
  const processHarness = new EventEmitter();
  const logEntries = [];
  const exitCodes = [];

  return {
    processHarness,
    logEntries,
    exitCodes,
    options: {
      logger: (...args) => logEntries.push(args),
      exit: (code) => exitCodes.push(code)
    }
  };
}

test("installs process-level fatal error handlers once", () => {
  const { processHarness, options } = createProcessHarness();

  assert.equal(installProcessErrorHandlers(processHarness, options), true);
  assert.equal(installProcessErrorHandlers(processHarness, options), false);
  assert.equal(processHarness.listenerCount("unhandledRejection"), 1);
  assert.equal(processHarness.listenerCount("uncaughtException"), 1);
});

test("unhandled promise rejections are logged and terminate the process", () => {
  const { processHarness, logEntries, exitCodes, options } = createProcessHarness();
  const rejection = new Error("background failure");

  installProcessErrorHandlers(processHarness, options);
  processHarness.emit("unhandledRejection", rejection);

  assert.equal(exitCodes[0], 1);
  assert.deepEqual(logEntries[0], ["Unhandled promise rejection:", rejection]);
});

test("uncaught exceptions are logged and terminate the process", () => {
  const { processHarness, logEntries, exitCodes, options } = createProcessHarness();
  const error = new Error("fatal failure");

  installProcessErrorHandlers(processHarness, options);
  processHarness.emit("uncaughtException", error);

  assert.equal(exitCodes[0], 1);
  assert.deepEqual(logEntries[0], ["Uncaught exception:", error]);
});
