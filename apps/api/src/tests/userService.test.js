import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";

test("listUsers returns a defensive snapshot", async () => {
  await createUser({
    email: "snapshot@example.com",
    fullName: "Snapshot User"
  });

  const snapshot = await listUsers();
  snapshot.push({
    id: "usr_malicious",
    email: "evil@example.com",
    fullName: "Malicious User"
  });

  snapshot[0].fullName = "Tampered User";

  const fresh = await listUsers();
  assert.equal(fresh.length, 1);
  assert.deepEqual(fresh[0], {
    id: fresh[0].id,
    email: "snapshot@example.com",
    fullName: "Snapshot User"
  });
});
