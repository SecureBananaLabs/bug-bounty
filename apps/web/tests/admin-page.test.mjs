import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8");

test("admin page exposes actionable moderation sections", () => {
  assert.match(source, /Moderation Queue/);
  assert.match(source, /Trust Signals/);
  assert.match(source, /Platform Controls/);
});

test("admin page is not the placeholder card", () => {
  assert.doesNotMatch(source, /Moderation queues, trust metrics, and platform controls are available here/);
  assert.match(source, /Review evidence/);
  assert.match(source, /Manual payout release/);
});
