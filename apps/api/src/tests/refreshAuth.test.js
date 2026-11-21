import test from "node:test";
import assert from "node:assert/strict";

process.env.JWT_SECRET ??= "test-secret";

const { createApp } = await import("../app.js");
const { signAccessToken, verifyAccessToken } = await import("../utils/jwt.js");

// Regression test for #13340 (reissue of #2847): POST /api/auth/refresh used
// to issue a fresh token without checking the requester at all, signing for
// the hard-coded subject usr_existing with role client. The route now
// requires the bearer-token authMiddleware and the refreshed token is signed
// for the authenticated subject and role.

let base;
let server;

test.before(async () => {
  await new Promise((resolve) => {
    server = createApp().listen(0, "127.0.0.1", () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

test.after(() => new Promise((resolve) => server.close(resolve)));

async function refresh(headers = {}) {
  const res = await fetch(`${base}/api/auth/refresh`, { method: "POST", headers });
  return { status: res.status, json: await res.json().catch(() => null) };
}

test("POST /api/auth/refresh rejects requests without a bearer token", async () => {
  const res = await refresh();
  assert.equal(res.status, 401);
  assert.equal(res.json.success, false);
});

test("POST /api/auth/refresh rejects an invalid token", async () => {
  const res = await refresh({ authorization: "Bearer not-a-jwt" });
  assert.equal(res.status, 401);
});

test("POST /api/auth/refresh preserves the authenticated subject and role", async () => {
  const claims = { sub: "usr_caller", role: "freelancer" };
  const res = await refresh({ authorization: `Bearer ${signAccessToken(claims)}` });

  assert.equal(res.status, 200);
  assert.equal(res.json.success, true);

  const refreshed = verifyAccessToken(res.json.data.token);
  assert.equal(refreshed.sub, "usr_caller", "token subject must match the caller");
  assert.equal(
    refreshed.role,
    "freelancer",
    "token role must match the caller role"
  );
  assert.notEqual(refreshed.sub, "usr_existing", "hard-coded subject is gone");
});
