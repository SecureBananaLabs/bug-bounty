import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envScriptPath = path.resolve(__dirname, "../config/env.js");

test("env config - development fallback", async () => {
  const code = `
    import('file://${envScriptPath}').then(({ env }) => {
      if (env.jwtSecret !== 'development-secret') {
        process.exit(1);
      }
      process.exit(0);
    }).catch(err => {
      console.error(err);
      process.exit(2);
    });
  `;
  const childEnv = { ...process.env, NODE_ENV: "development" };
  delete childEnv.JWT_SECRET;
  const result = execSync(`node --input-type=module`, {
    input: code,
    env: childEnv
  });
  assert.ok(result);
});

test("env config - production rejection", async () => {
  const code = `
    import('file://${envScriptPath}').then(() => {
      process.exit(1);
    }).catch(err => {
      if (err.message.includes('JWT_SECRET is required')) {
        process.exit(0);
      }
      process.exit(2);
    });
  `;
  const childEnv = { ...process.env, NODE_ENV: "production" };
  delete childEnv.JWT_SECRET;
  const result = execSync(`node --input-type=module`, {
    input: code,
    env: childEnv
  });
  assert.ok(result);
});

test("env config - production explicit secret", async () => {
  const code = `
    import('file://${envScriptPath}').then(({ env }) => {
      if (env.jwtSecret !== 'my-secure-prod-secret') {
        process.exit(1);
      }
      process.exit(0);
    }).catch(err => {
      console.error(err);
      process.exit(2);
    });
  `;
  const result = execSync(`node --input-type=module`, {
    input: code,
    env: { ...process.env, NODE_ENV: "production", JWT_SECRET: "my-secure-prod-secret" }
  });
  assert.ok(result);
});
