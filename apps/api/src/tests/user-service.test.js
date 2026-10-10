import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("listUsers returns a defensive snapshot", async () => {
  const created = await createUser({ email: "user@example.com" });
  const listed = await listUsers();

  listed.push({ id: "usr_injected", email: "injected@example.com" });

  const listedAgain = await listUsers();

  assert.ok(listedAgain.some((user) => user.id === created.id));
  assert.equal(
    listedAgain.some((user) => user.id === "usr_injected"),
    false,
  );
});
