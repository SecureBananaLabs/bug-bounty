import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("GET /api/messages is protected by auth middleware", async () => {
  const source = await readFile(new URL("../routes/messageRoutes.js", import.meta.url), "utf8");

  assert.match(source, /import \{ authMiddleware \} from "\.\.\/middleware\/auth\.js";/);
  assert.match(source, /messageRoutes\.get\("\/",\s*authMiddleware,\s*getMessages\);/);
});
