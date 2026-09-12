import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

const apiRoot = fileURLToPath(new URL("../../", import.meta.url));

test("server reports the actual port selected for PORT=0", async () => {
  const child = spawn(process.execPath, ["src/server.js"], {
    cwd: apiRoot,
    env: { ...process.env, NODE_ENV: "test", PORT: "0" },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let exited = false;
  let stderr = "";
  let stdout = "";
  child.once("exit", () => {
    exited = true;
  });
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  try {
    const port = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timed out waiting for startup log. stderr: ${stderr}`));
      }, 5000);

      child.once("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      child.once("exit", (code, signal) => {
        clearTimeout(timeout);
        reject(new Error(`Server exited before startup (code ${code}, signal ${signal}). stderr: ${stderr}`));
      });

      child.stdout.setEncoding("utf8");
      child.stdout.on("data", (chunk) => {
        stdout += chunk;
        const match = stdout.match(/API listening on http:\/\/localhost:(\d+)/);
        if (match) {
          clearTimeout(timeout);
          resolve(Number(match[1]));
        }
      });
    });

    assert.ok(port > 0, `expected an ephemeral port, received ${port}`);
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(response.status, 200, "the reported port should accept API requests");
  } finally {
    if (!exited) {
      child.kill();
      await once(child, "exit");
    }
  }
});
