import test from "node:test";
import assert from "node:assert/strict";

test("PORT Environment Variable Parsing", async (t) => {
  const originalPort = process.env.PORT;

  t.afterEach(() => {
    if (originalPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = originalPort;
    }
  });

  await t.test("falls back to 4000 for non-numeric port values", async () => {
    process.env.PORT = "abc";
    const { env } = await import(`../config/env.js?t=${Date.now()}_1`);
    assert.equal(env.port, 4000);
  });

  await t.test("falls back to 4000 for empty port values", async () => {
    process.env.PORT = "";
    const { env } = await import(`../config/env.js?t=${Date.now()}_2`);
    assert.equal(env.port, 4000);
  });

  await t.test("falls back to 4000 for out-of-range port values", async () => {
    process.env.PORT = "70000";
    const { env } = await import(`../config/env.js?t=${Date.now()}_3`);
    assert.equal(env.port, 4000);
  });

  await t.test("falls back to 4000 for non-integer port values", async () => {
    process.env.PORT = "1234.56";
    const { env } = await import(`../config/env.js?t=${Date.now()}_4`);
    assert.equal(env.port, 4000);
  });

  await t.test("uses valid port value", async () => {
    process.env.PORT = "5000";
    const { env } = await import(`../config/env.js?t=${Date.now()}_5`);
    assert.equal(env.port, 5000);
  });
});
