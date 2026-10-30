import assert from "node:assert/strict";
import { test } from "node:test";

const serviceUrl = new URL("../services/notificationService.js", import.meta.url);

// Import fresh in-memory storage for each case. The actual service and crypto
// implementation run unchanged; only the clock is pinned in collision cases.
async function service(name) {
  return import(`${serviceUrl.href}?case=${name}`);
}

test("notifications created in the same millisecond have distinct IDs", async (t) => {
  t.mock.method(Date, "now", () => 1700000000000);
  const { createNotification } = await service("same-millisecond");
  const first = await createNotification({ message: "First update" });
  const second = await createNotification({ message: "Second update" });
  assert.notEqual(first.id, second.id);
  assert.match(first.id, /^ntf_/);
  assert.match(second.id, /^ntf_/);
});

test("concurrent batches remain distinct when the clock moves backward", async (t) => {
  const clock = t.mock.method(Date, "now", () => 1700000000000);
  const { createNotification } = await service("batch-and-rollback");
  const before = await Promise.all(
    ["A", "B", "C"].map((message) => createNotification({ message })),
  );
  clock.mock.mockImplementation(() => 1699999999000);
  const after = await Promise.all(
    ["D", "E", "F"].map((message) => createNotification({ message })),
  );
  const ids = [...before, ...after].map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length);
});

test("ID changes preserve unread state, payload, listing and insertion order", async () => {
  const { createNotification, listNotifications } = await service("compatibility");
  const first = await createNotification({ message: "Proposal accepted", userId: "user_a" });
  const second = await createNotification({ message: "New message", userId: "user_b" });
  assert.deepEqual(await listNotifications(), [first, second]);
  assert.deepEqual(
    [first, second].map(({ id, ...payload }) => payload),
    [
      { read: false, message: "Proposal accepted", userId: "user_a" },
      { read: false, message: "New message", userId: "user_b" },
    ],
  );
});
