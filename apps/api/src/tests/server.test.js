import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { bootstrap } from "../server.js";

test("server module exports bootstrap without starting on import", () => {
  assert.equal(typeof bootstrap, "function");
});

test("bootstrap rejects when database startup fails", async () => {
  await assert.rejects(
    bootstrap({
      connect: async () => {
        throw new Error("database unavailable");
      },
      createServerApp: () => assert.fail("app should not be created after connect failure")
    }),
    /database unavailable/
  );
});

test("bootstrap rejects when listener startup fails", async () => {
  await assert.rejects(
    bootstrap({
      connect: async () => {},
      createServerApp: () => ({
        listen() {
          const server = new EventEmitter();
          queueMicrotask(() => server.emit("error", new Error("listen failed")));
          return server;
        }
      })
    }),
    /listen failed/
  );
});
