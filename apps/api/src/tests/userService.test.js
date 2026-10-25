import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("createUser requires fullName and ignores client id", async () => {
  const originalNow = Date.now;
  Date.now = () => 1700000003000;

  try {
    await assert.rejects(
      createUser({
        email: "no-name@example.com",
        password: "pw",
      }),
      (err) => err.message === "Full name required"
    );

    const user = await createUser({
      fullName: "Ada",
      email: "ada@example.com",
      id: "client_supplied_id",
      role: "client",
      password: "pw",
    });

    assert.equal(user.id, "usr_1700000003000");
    assert.equal(user.fullName, "Ada");
    const [storedUser] = await listUsers();
    assert.equal(storedUser.id, "usr_1700000003000");
  } finally {
    Date.now = originalNow;
  }
});
