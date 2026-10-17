import test from "node:test";
import assert from "node:assert/strict";

async function importEnv() {
    return import(`../config/env.js?test=${Date.now()}-${Math.random()}`);
}

async function withEnv(values, callback) {
    const previous = {
          NODE_ENV: process.env.NODE_ENV,
          JWT_SECRET: process.env.JWT_SECRET
    };

  for (const [key, value] of Object.entries(values)) {
        if (value === undefined) {
                delete process.env[key];
        } else {
                process.env[key] = value;
        }
  }

  try {
        return await callback();
  } finally {
        for (const [key, value] of Object.entries(previous)) {
                if (value === undefined) {
                          delete process.env[key];
                } else {
                          process.env[key] = value;
                }
        }
  }
}

test("development uses the local JWT secret fallback", async () => {
    await withEnv({ NODE_ENV: undefined, JWT_SECRET: undefined }, async () => {
          const { env } = await importEnv();

                      assert.equal(env.nodeEnv, "development");
          assert.equal(env.jwtSecret, "development-secret");
    });
});

test("non-development environments require JWT_SECRET", async () => {
    await withEnv({ NODE_ENV: "production", JWT_SECRET: undefined }, async () => {
          await assert.rejects(importEnv, /JWT_SECRET is required outside development/);
    });
});

test("non-development environments accept configured JWT_SECRET", async () => {
    await withEnv({ NODE_ENV: "production", JWT_SECRET: "configured-secret" }, async () => {
          const { env } = await importEnv();

                      assert.equal(env.nodeEnv, "production");
          assert.equal(env.jwtSecret, "configured-secret");
    });
});
