import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const pagePath = resolve("apps/web/app/notifications/page.tsx");

test("notifications page renders mock alerts", async () => {
  const source = await readFile(pagePath, "utf8");

  assert.match(source, /Proposal updates/);
  assert.match(source, /Unread messages/);
  assert.match(source, /Billing alerts/);
  assert.match(source, /alerts\.map/);
});
