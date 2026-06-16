import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const pagePath = resolve("apps/web/app/billing/page.tsx");

test("billing page renders account billing overview", async () => {
  const source = await readFile(pagePath, "utf8");

  assert.match(source, /Current balance/);
  assert.match(source, /Primary payout method/);
  assert.match(source, /Latest invoice/);
  assert.match(source, /Invoices, payout methods, and transaction history are managed here\./);
});
