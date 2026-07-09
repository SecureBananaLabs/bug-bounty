import test, { mock } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { registerUser } from "../services/authService.js";

test("registerUser signs the access token with the created user id", async () => {
  const dateNow = mock.method(Date, "now", mock.fn(() => 1700000000000));

  try {
    const user = await registerUser({
      email: "client@example.com",
      role: "client"
    });
    const tokenPayload = jwt.decode(user.token);

    assert.equal(user.id, "usr_1700000000000");
    assert.equal(tokenPayload.sub, user.id);
    assert.equal(tokenPayload.role, user.role);
  } finally {
    dateNow.mock.restore();
  }
});
