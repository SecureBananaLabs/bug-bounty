import test from "node:test";
import assert from "node:assert/strict";
import { bootstrap, handleBootstrapFailure } from "../server.js";

test("bootstrap connects before starting the HTTP listener", async () => {
  const events = [];
  const fakeServer = { close() {} };
  const fakeApp = {
    listen(port, onListening) {
      events.push(["listen", port]);
      onListening();
      return fakeServer;
    }
  };

  const server = await bootstrap({
    connect: async () => events.push(["connect"]),
    createApplication: () => fakeApp,
    port: 0,
    logger: { log: (message) => events.push(["log", message]) }
  });

  assert.equal(server, fakeServer);
  assert.deepEqual(events, [
    ["connect"],
    ["listen", 0],
    ["log", "API listening on http://localhost:0"]
  ]);
});

test("bootstrap surfaces startup dependency failures", async () => {
  await assert.rejects(
    bootstrap({
      connect: async () => {
        throw new Error("database unavailable");
      },
      createApplication: () => {
        throw new Error("app should not be created after connect failure");
      },
      logger: { log: () => {} }
    }),
    /database unavailable/
  );
});

test("handleBootstrapFailure records clear startup failure and non-zero exit", () => {
  const originalExitCode = process.exitCode;
  const logs = [];

  try {
    process.exitCode = undefined;
    const error = new Error("database unavailable");
    handleBootstrapFailure(error, { error: (...args) => logs.push(args) });

    assert.equal(process.exitCode, 1);
    assert.equal(logs.length, 1);
    assert.equal(logs[0][0], "API failed to start:");
    assert.equal(logs[0][1], error);
  } finally {
    process.exitCode = originalExitCode;
  }
});
