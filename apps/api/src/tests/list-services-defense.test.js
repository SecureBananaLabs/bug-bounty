import test from "node:test";
import assert from "node:assert/strict";

async function importFresh(relativePath, tag) {
  const url = new URL(relativePath, import.meta.url);
  url.searchParams.set("v", tag);
  return import(url.href);
}

async function assertDefensiveList(relativePath, exportName, tag) {
  const module = await importFresh(relativePath, tag);
  const listFn = module[exportName];

  const first = await listFn();
  assert.ok(Array.isArray(first));
  const originalLength = first.length;
  first.push({ injected: true });

  const second = await listFn();
  assert.ok(Array.isArray(second));
  assert.notStrictEqual(first, second);
  assert.equal(second.length, originalLength);
  assert.equal(second.some((item) => item?.injected === true), false);
}

const cases = [
  ["../services/userService.js", "listUsers"],
  ["../services/jobService.js", "listJobs"],
  ["../services/proposalService.js", "listProposals"],
  ["../services/reviewService.js", "listReviews"],
  ["../services/messageService.js", "listMessages"],
  ["../services/notificationService.js", "listNotifications"]
];

for (const [relativePath, exportName] of cases) {
  test(`${exportName} returns a defensive copy`, async () => {
    await assertDefensiveList(relativePath, exportName, `${exportName}-${Date.now()}`);
  });
}
