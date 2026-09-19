import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { setupGracefulShutdown } from "../server.js";

test("setupGracefulShutdown closes server on shutdown trigger", async () => {
  const server = http.createServer((req, res) => res.end("ok"));
  await new Promise((resolve) => server.listen(0, resolve));

  let closed = false;
  const shutdownHelper = setupGracefulShutdown(server, {
    onSuccess: () => {
      closed = true;
    }
  });

  // Trigger shutdown manually with SIGTERM
  shutdownHelper.handleShutdown("SIGTERM");

  // Wait for server to close
  await new Promise((resolve) => setTimeout(resolve, 100));

  assert.equal(closed, true);
  assert.equal(server.listening, false);

  // Clean listeners
  shutdownHelper.cleanup();
});
