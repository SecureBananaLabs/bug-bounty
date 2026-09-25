import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(url, body) {
  const target = new URL(url);
  const requestBody = JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const request = http.request({
      hostname: target.hostname,
      port: target.port,
      path: `${target.pathname}${target.search}`,
      method: "POST",
      agent: false,
      headers: {
        "content-length": Buffer.byteLength(requestBody),
        "content-type": "application/json"
      }
    }, (response) => {
      let responseBody = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        responseBody += chunk;
      });
      response.on("end", () => {
        resolve({
          status: response.statusCode,
          json: () => JSON.parse(responseBody)
        });
      });
    });

    request.on("error", reject);
    request.end(requestBody);
  });
}

test("POST /api/auth/register defaults new users to client role", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/api/auth/register`, {
      email: "client@example.com",
      password: "password123"
    });
    const payload = response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.role, "client");
    assert.match(payload.data.token, /^[\w-]+\.[\w-]+\.[\w-]+$/);
  });
});

test("POST /api/auth/register rejects public admin role escalation", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/api/auth/register`, {
      email: "admin@example.com",
      password: "password123",
      role: "admin"
    });
    const payload = response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid request payload");
    assert.equal(payload.issues[0].path, "role");
  });
});
