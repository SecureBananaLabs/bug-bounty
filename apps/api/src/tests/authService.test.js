import assert from "node:assert/strict";
import test from "node:test";

import { registerUser } from "../services/authService.js";

test("registerUser uses the same ID for the response and JWT subject", async () => {
  const originalDateNow = Date.now;

  let dateNowCalls = 0;

  Date.now = () => {
    dateNowCalls += 1;

    // Simule le comportement qui provoquait le bug :
    // deux appels successifs retournent deux valeurs différentes.
    return dateNowCalls === 1 ? 1000000 : 2000000;
  };

  try {
    const result = await registerUser({
      email: "test@example.com",
      role: "client"
    });

    assert.equal(result.id, "usr_1000000");

    const tokenPayload = JSON.parse(
      Buffer.from(result.token.split(".")[1], "base64url").toString("utf8")
    );

    assert.equal(
      tokenPayload.sub,
      result.id,
      "JWT subject must match the returned user ID"
    );

    assert.equal(
      dateNowCalls,
      1,
      "Date.now() must only be called once when creating the user ID"
    );
  } finally {
    Date.now = originalDateNow;
  }
});
