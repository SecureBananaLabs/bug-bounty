import test from "node:test";
import assert from "node:assert/strict";

const envModuleUrl = new URL("../config/env.js", import.meta.url).href;

async function loadEnv(portValue) {
  const original = process.env.PORT;

  try {
    if (portValue === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = portValue;
    }

    return await import(`${envModuleUrl}?case=${Date.now()}-${Math.random()}`);
  } finally {
    if (original === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = original;
    }
  }
}

test("env falls back to the default port for invalid PORT values", async () => {
  const { env } = await loadEnv("abc");
  assert.equal(env.port, 4000);
});

test("env preserves valid explicit ports", async () => {
  const explicit = await loadEnv("8080");
  assert.equal(explicit.env.port, 8080);

  const zeroPort = await loadEnv("0");
  assert.equal(zeroPort.env.port, 0);
});
