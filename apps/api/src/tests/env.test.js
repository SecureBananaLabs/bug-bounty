import test from "node:test";
import assert from "node:assert/strict";

test("Env configuration port fallback tests", async (t) => {
  const originalPort = process.env.PORT;

  t.after(() => {
    process.env.PORT = originalPort;
  });

  await t.test("Valid integer port is preserved", async () => {
    process.env.PORT = "5000";
    const { env } = await import(`../config/env.js?update=${Date.now()}`);
    assert.equal(env.port, 5000);
  });

  await t.test("Invalid port falls back to 4000", async () => {
    process.env.PORT = "not-a-number";
    const { env } = await import(`../config/env.js?update=${Date.now() + 1}`);
    assert.equal(env.port, 4000);
  });

  await t.test("Empty port falls back to 4000", async () => {
    process.env.PORT = "";
    const { env } = await import(`../config/env.js?update=${Date.now() + 2}`);
    assert.equal(env.port, 4000);
  });

  await t.test("Out of range port falls back to 4000", async () => {
    process.env.PORT = "999999";
    const { env } = await import(`../config/env.js?update=${Date.now() + 3}`);
    assert.equal(env.port, 4000);
  });
});
