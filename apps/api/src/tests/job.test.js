import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import jwt from "jsonwebtoken";

function createTestServer() {
  const app = createApp();
  const server = app.listen(0);
  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

function makeToken(sub, role) {
  return jwt.sign({ sub, role }, "development-secret", { expiresIn: "1h" });
}

const validJob = {
  clientId: "usr_testuser",
  title: "Build a website",
  description: "Need a professional business website with contact form",
  budgetMin: 500,
  budgetMax: 1000,
  categoryId: "cat_web",
  skills: ["javascript", "html"]
};

test("POST /api/jobs — no auth returns 401", async () => {
  const server = await createTestServer();
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validJob),
    });
    assert.equal(res.status, 401, `Expected 401, got ${res.status}`);
  } finally {
    await closeServer(server);
  }
});

test("POST /api/jobs — invalid token returns 401", async () => {
  const server = await createTestServer();
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid.token.here"
      },
      body: JSON.stringify(validJob),
    });
    assert.equal(res.status, 401, `Expected 401, got ${res.status}`);
  } finally {
    await closeServer(server);
  }
});

test("POST /api/jobs — valid token but clientId mismatch returns 403 (IDOR blocked)", async () => {
  const server = await createTestServer();
  const { port } = server.address();
  try {
    const token = makeToken("usr_attacker", "client");
    // Attacker tries to create a job with victim's clientId
    const maliciousPayload = { ...validJob, clientId: "usr_victim" };

    const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(maliciousPayload),
    });

    assert.equal(res.status, 403, `Expected 403 IDOR block, got ${res.status}`);
    const payload = await res.json();
    assert.ok(
      payload.message.toLowerCase().includes("another client") ||
      payload.message.toLowerCase().includes("cannot create"),
      `Expected IDOR error message, got: ${payload.message}`
    );
  } finally {
    await closeServer(server);
  }
});

test("POST /api/jobs — valid token and matching clientId returns 201", async () => {
  const server = await createTestServer();
  const { port } = server.address();
  try {
    const userId = "usr_legitimate_user";
    const token = makeToken(userId, "client");
    const payload = { ...validJob, clientId: userId };

    const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 201, `Expected 201, got ${res.status} body: ${JSON.stringify(await res.clone().json())}`);
    const responsePayload = await res.json();
    assert.ok(responsePayload.data, "Response should have data");
    assert.equal(responsePayload.data.clientId, userId, "Job should be created with correct clientId");
    assert.equal(responsePayload.data.status, "open", "Job should have open status");
  } finally {
    await closeServer(server);
  }
});

test("POST /api/jobs — missing clientId returns 400", async () => {
  const server = await createTestServer();
  const { port } = server.address();
  try {
    const token = makeToken("usr_testuser", "client");
    const badPayload = { ...validJob };
    delete badPayload.clientId;

    const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(badPayload),
    });

    assert.equal(res.status, 400, `Expected 400 for missing clientId, got ${res.status}`);
  } finally {
    await closeServer(server);
  }
});

test("POST /api/jobs — title too short returns 400", async () => {
  const server = await createTestServer();
  const { port } = server.address();
  try {
    const token = makeToken("usr_testuser", "client");
    const badPayload = { ...validJob, title: "Hi" }; // min 4 chars

    const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(badPayload),
    });

    assert.equal(res.status, 400, `Expected 400 for short title, got ${res.status}`);
  } finally {
    await closeServer(server);
  }
});

test("GET /api/jobs — returns job list without auth", async () => {
  const server = await createTestServer();
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const payload = await res.json();
    assert.ok(Array.isArray(payload.data), "Should return array of jobs");
  } finally {
    await closeServer(server);
  }
});

test("POST /api/jobs — different role (freelancer) can still create job with own clientId", async () => {
  const server = await createTestServer();
  const { port } = server.address();
  try {
    const token = makeToken("usr_freelancer", "freelancer");
    const payload = { ...validJob, clientId: "usr_freelancer" };

    const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 201, `Expected 201 for freelancer creating own job, got ${res.status}`);
  } finally {
    await closeServer(server);
  }
});
