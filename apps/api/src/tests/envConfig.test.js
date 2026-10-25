import test from "node:test";
import assert from "node:assert/strict";

async function importEnvModule() {
  return import(`../config/env.js?cacheBust=${Date.now()}_${Math.random()}`);
}

test("env falls back to port 4000 when PORT is invalid", async () => {
  const originalPort = process.env.PORT;
  const originalWarn = console.warn;
  const warnings = [];

  process.env.PORT = "abc";
  console.warn = (message) => warnings.push(message);

  try {
    const { env } = await importEnvModule();
    assert.equal(env.port, 4000);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /Invalid PORT value "abc"/);
  } finally {
    console.warn = originalWarn;
    if (originalPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = originalPort;
    }
  }
});

test("env preserves valid numeric PORT values", async () => {
  const originalPort = process.env.PORT;

  process.env.PORT = "4100";

  try {
    const { env } = await importEnvModule();
    assert.equal(env.port, 4100);
  } finally {
    if (originalPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = originalPort;
    }
  }
});
