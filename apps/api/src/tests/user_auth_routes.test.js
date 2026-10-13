import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

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

test("User routes authorization guard suite", async (t) => {
  const app = createApp();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  t.after(() => {
    server.close();
  });

  await t.test("GET /api/users without token returns 401 Unauthorized", async () => {
    const res = await makeRequest(server, {
      path: "/api/users",
      method: "GET",
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Unauthorized");
  });

  await t.test("GET /api/users with invalid bearer token returns 401 Invalid token", async () => {
    const res = await makeRequest(server, {
      path: "/api/users",
      method: "GET",
      headers: {
        Authorization: "Bearer invalid.token.payload",
      },
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Invalid token");
  });

  await t.test("GET /api/users with valid bearer token returns 200 OK", async () => {
    const validToken = signAccessToken({ id: "usr_admin", role: "admin" });
    const res = await makeRequest(server, {
      path: "/api/users",
      method: "GET",
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  await t.test("POST /api/users with valid bearer token returns 201 Created", async () => {
    const validToken = signAccessToken({ id: "usr_admin", role: "admin" });
    const res = await makeRequest(
      server,
      {
        path: "/api/users",
        method: "POST",
        headers: {
          Authorization: `Bearer ${validToken}`,
          "Content-Type": "application/json",
        },
      },
      { name: "John Doe", email: "john@example.com" }
    );

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.name, "John Doe");
    assert.ok(res.body.data.id.startsWith("usr_"));
  });
});
