import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createShutdownHandler } from "../utils/shutdown.js";

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
    });
    server.once("error", reject);
    server.listen(0, () => resolve(server));
  });
}

test("createShutdownHandler closes the server and calls onClose", async () => {
  const server = await startServer();
  let closed = false;

  await new Promise((resolve, reject) => {
    const shutdown = createShutdownHandler(server, {
      onClose: (error) => {
        if (error) {
          reject(error);
          return;
        }
        closed = true;
        resolve();
      }
    });
    shutdown();
  });

  assert.equal(closed, true);
  assert.equal(server.listening, false);
});

test("shutdown is idempotent (second call is a no-op)", async () => {
  const server = await startServer();
  let closeCount = 0;

  await new Promise((resolve, reject) => {
    const shutdown = createShutdownHandler(server, {
      onClose: (error) => {
        if (error) {
          reject(error);
          return;
        }
        closeCount += 1;
        resolve();
      }
    });
    shutdown();
    shutdown();
  });

  assert.equal(closeCount, 1);
});

test("shutdown triggers onForceClose when the timeout elapses", async () => {
  // fake server yang close()-nya tidak pernah selesai -> memaksa timeout
  const fakeServer = { close: () => {} };
  let forced = null;

  await new Promise((resolve) => {
    const shutdown = createShutdownHandler(fakeServer, {
      timeoutMs: 20,
      onClose: () => {},
      onForceClose: (reason) => {
        forced = reason;
        resolve();
      }
    });
    shutdown();
  });

  assert.match(forced, /timed out/i);
});
