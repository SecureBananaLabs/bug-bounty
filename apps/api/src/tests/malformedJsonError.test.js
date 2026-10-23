import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { errorHandler, isMalformedJsonError } from "../middleware/errorHandler.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

test("isMalformedJsonError identifies body-parser entity.parse.failed errors and rejects ordinary errors", () => {
  assert.equal(isMalformedJsonError(null), false);
  assert.equal(isMalformedJsonError(new Error("db failure")), false);
  assert.equal(isMalformedJsonError(new SyntaxError("ordinary syntax error")), false);

  const parserErr = Object.assign(new SyntaxError("Unexpected end of JSON input"), {
    status: 400,
    statusCode: 400,
    type: "entity.parse.failed",
    body: '{"title":'
  });
  assert.equal(isMalformedJsonError(parserErr), true);

  const fallbackSyntaxErr = Object.assign(new SyntaxError("Unexpected token"), {
    statusCode: 400,
    body: "{bad"
  });
  assert.equal(isMalformedJsonError(fallbackSyntaxErr), true);
});

test("POST with malformed JSON body returns HTTP 400 without echoing raw request body", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"title":"secret-token-leak",'
    });

    assert.equal(res.status, 400);
    const payload = await res.json();
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid JSON payload"
    });
    assert.ok(!JSON.stringify(payload).includes("secret-token-leak"));
  });
});

test("errorHandler delegates to next when headersSent is true and returns 500 for unexpected errors", () => {
  let delegatedError = null;
  errorHandler(
    new Error("stream failure"),
    {},
    { headersSent: true },
    (err) => {
      delegatedError = err;
    }
  );
  assert.equal(delegatedError?.message, "stream failure");

  let capturedStatus = null;
  let capturedBody = null;
  const mockRes = {
    headersSent: false,
    status(code) {
      capturedStatus = code;
      return {
        json(payload) {
          capturedBody = payload;
          return payload;
        }
      };
    }
  };

  errorHandler(new Error("unexpected crash"), {}, mockRes, () => {});
  assert.equal(capturedStatus, 500);
  assert.deepEqual(capturedBody, {
    success: false,
    message: "Unexpected server error"
  });
});
