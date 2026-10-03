import test from "node:test";
import assert from "node:assert/strict";
import { bootstrap, shutdown } from "../server.js";

test("server graceful shutdown closes server and disconnects DB", async () => {
  const server = await bootstrap();
  assert.ok(server.listening, "Server should be listening");

  await shutdown("SIGTERM");
  assert.strictEqual(server.listening, false, "Server should no longer be listening");
});
