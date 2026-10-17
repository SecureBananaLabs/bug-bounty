import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { requestLogger } from "../middleware/logging.js";

function withCapturedOutput(fn) {
  const original = process.stdout.write.bind(process.stdout);
  const lines = [];

  process.stdout.write = (chunk) => {
    lines.push(String(chunk));

    return true;
  };

  try {
    return fn().then((value) => {
      process.stdout.write = original;

      return { value, lines };
    });
  } catch (error) {
    process.stdout.write = original;

    throw error;
  }
}

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return server.address().port;
}

async function close(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("request logger is a middleware function", () => {
  assert.equal(typeof requestLogger, "function");
});

test("every request emits one tiny log line", async () => {
  const app = createApp();
  const server = app.listen(0);
  const port = await listen(server);

  const { lines } = await withCapturedOutput(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/health`);

    assert.equal(response.status, 200);

    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
  });

  await close(server);

  const output = lines.join("");

  assert.match(output, /GET \/health 200/);
});
