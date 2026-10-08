import test from "node:test";
import assert from "node:assert/strict";
import { SHUTDOWN_TIMEOUT_MS, createShutdownHandler, startServer } from "../server.js";

function settled(server) {
  return new Promise((resolve) => {
    if (!server.listening) {
      resolve();
      return;
    }

    server.close(resolve);
  });
}

test("startServer listens and serves the health endpoint", async () => {
  const { server } = startServer({ port: 0 });

  await new Promise((resolve) => server.once("listening", resolve));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/health`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload, { ok: true, service: "api" });

  await settled(server);
});

test("shutdown handler closes the server and is idempotent", async () => {
  const { server } = startServer({ port: 0 });

  await new Promise((resolve) => server.once("listening", resolve));

  let closed = 0;
  const shutdown = createShutdownHandler(server, {
    onClosed() {
      closed += 1;
    }
  });

  shutdown();
  shutdown();

  await new Promise((resolve) => setTimeout(resolve, 20));

  assert.equal(server.listening, false);
  assert.equal(closed, 1);
});

test("shutdown timeout is bounded", () => {
  assert.ok(Number.isFinite(SHUTDOWN_TIMEOUT_MS));
  assert.ok(SHUTDOWN_TIMEOUT_MS > 0);
});

test("shutdown handler stops an in-flight keep-alive after the timeout", async () => {
  const { server } = startServer({ port: 0 });

  await new Promise((resolve) => server.once("listening", resolve));

  let timedOut = false;
  const fake = {
    close(done) {
      done(null);
    },
    closeAllConnections() {
      timedOut = true;
    }
  };

  createShutdownHandler(fake, { timeoutMs: 5 })();

  await new Promise((resolve) => setTimeout(resolve, 30));

  assert.equal(timedOut, true);
  assert.equal(server.listening, true);

  await settled(server);
});
