import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("server module exports bootstrap without auto-starting", async () => {
  const module = await import(`../server.js?import-test=${Date.now()}`);

  assert.equal(typeof module.bootstrap, "function");
});

test("bootstrap starts the app with injectable dependencies", async () => {
  const { bootstrap } = await import(`../server.js?start-test=${Date.now()}`);
  const server = await bootstrap({
    connect: async () => ({ connected: true }),
    createApplication: createApp,
    port: 0,
    logger: { log() {} }
  });

  assert.ok(server.address().port > 0);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("bootstrap surfaces startup dependency failures", async () => {
  const { bootstrap } = await import(`../server.js?failure-test=${Date.now()}`);

  await assert.rejects(
    () =>
      bootstrap({
        connect: async () => {
          throw new Error("database unavailable");
        },
        createApplication: createApp,
        port: 0,
        logger: { log() {} }
      }),
    /database unavailable/
  );
});
