import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const paymentRoutesPath = new URL("../routes/paymentRoutes.js", import.meta.url);

test("payment creation route requires authentication", async () => {
  const source = await readFile(paymentRoutesPath, "utf8");

  assert.match(source, /import\s+\{\s*authMiddleware\s*\}\s+from\s+["']\.\.\/middleware\/auth\.js["'];/);
  assert.match(source, /paymentRoutes\.post\(\s*["']\/["']\s*,\s*authMiddleware\s*,\s*createPayment\s*\)/);
});
