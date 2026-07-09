import test from "node:test";
import assert from "node:assert/strict";

test("env port fallback parsing", async (t) => {
  const getPortWithEnv = async (val) => {
    if (val === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = val;
    }
    const module = await import(`../config/env.js?update=${Date.now()}`);
    return module.env.port;
  };

  await t.test("parses valid port string", async () => {
    const port = await getPortWithEnv("8080");
    assert.equal(port, 8080);
  });

  await t.test("parses zero port string", async () => {
    const port = await getPortWithEnv("0");
    assert.equal(port, 0);
  });

  await t.test("falls back on abc", async () => {
    const port = await getPortWithEnv("abc");
    assert.equal(port, 4000);
  });

  await t.test("falls back on negative number", async () => {
    const port = await getPortWithEnv("-10");
    assert.equal(port, 4000);
  });

  await t.test("falls back on out of range number", async () => {
    const port = await getPortWithEnv("65536");
    assert.equal(port, 4000);
  });

  await t.test("falls back on decimal number", async () => {
    const port = await getPortWithEnv("80.5");
    assert.equal(port, 4000);
  });
});
