import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("listUsers returns defensive snapshots", async () => {
  await createUser({
    email: "snapshot@example.com",
    name: "Snapshot User",
    role: "client"
  });

  const firstList = await listUsers();
  firstList.push({ id: "injected", email: "injected@example.com" });
  firstList[0].email = "mutated@example.com";

  const secondList = await listUsers();

  assert.equal(secondList.some((user) => user.id === "injected"), false);
  assert.equal(secondList.some((user) => user.email === "mutated@example.com"), false);
  assert.equal(secondList.some((user) => user.email === "snapshot@example.com"), true);
});
