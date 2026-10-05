import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createApp } from "../app.js";

function makeRequest(server, options, body = null) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const reqOptions = {
      hostname: "127.0.0.1",
      port,
      path: options.path,
      method: options.method || "GET",
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

test("Auth validation error handling suite", async (t) => {
  const app = createApp();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  t.after(() => {
    server.close();
  });

  await t.test("POST /api/auth/register with empty body returns 400 Bad Request", async () => {
    const res = await makeRequest(
      server,
      {
        path: "/api/auth/register",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {}
    );

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Validation error");
    assert.ok(res.body.errors);
  });

  await t.test("POST /api/auth/register with invalid email returns 400 Bad Request", async () => {
    const res = await makeRequest(
      server,
      {
        path: "/api/auth/register",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { name: "Alice", email: "not-an-email", password: "password123", role: "client" }
    );

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Validation error");
    assert.ok(res.body.errors.email);
  });

  await t.test("POST /api/auth/login with missing password returns 400 Bad Request", async () => {
    const res = await makeRequest(
      server,
      {
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { email: "user@example.com" }
    );

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Validation error");
    assert.ok(res.body.errors.password);
  });
});
