import test from "node:test";
import assert from "node:assert/strict";
import { authMiddleware } from "../middleware/auth.js";

function createResponse() {
  const res = {
    statusCode: 200,
    body: "",
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(payload) {
      res.body = JSON.stringify(payload);
      return res;
    },
    send(payload) {
      res.body = typeof payload === "string" ? payload : JSON.stringify(payload);
      return res;
    },
    set() {
      return res;
    },
    setHeader() {
      return res;
    },
    end() {
      return res;
    }
  };
  return res;
}

function run(authorization) {
  const req = { headers: {} };
  if (authorization !== undefined) {
    req.headers.authorization = authorization;
  }
  const res = createResponse();
  let nextCalled = false;
  authMiddleware(req, res, () => {
    nextCalled = true;
  });
  return { res, nextCalled };
}

// A recognised scheme with a bogus token gets past header parsing and fails
// token verification ("Invalid token"); a header that is not accepted as a
// Bearer credential fails earlier with "Unauthorized".
for (const scheme of ["Bearer", "bearer", "BEARER", "bEaReR"]) {
  test(`accepts "${scheme}" scheme and passes the token to verification`, () => {
    const { res, nextCalled } = run(`${scheme} not-a-real-token`);
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.match(res.body, /Invalid token/);
  });
}

const malformed = [
  ["missing header", undefined],
  ["empty header", ""],
  ["scheme only", "Bearer"],
  ["scheme with trailing space only", "Bearer "],
  ["scheme with blank token", "bearer    "],
  ["extra token segments", "Bearer abc def"],
  ["different scheme", "Basic abc123"],
  ["scheme without separator", "Bearerabc123"],
  ["token only", "abc123"]
];

for (const [name, header] of malformed) {
  test(`rejects ${name} with 401 Unauthorized`, () => {
    const { res, nextCalled } = run(header);
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.match(res.body, /Unauthorized/);
  });
}
