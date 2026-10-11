import test, { describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const adminToken = signAccessToken({ id: "admin_1", role: "admin", name: "Test Admin" });
const userToken = signAccessToken({ id: "usr_1", role: "freelancer", name: "Test User" });

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

describe("Admin API", () => {
  let app;
  let server;
  let baseUrl;

  beforeEach(async () => {
    app = createApp();
    server = app.listen(0);
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  describe("GET /api/admin/metrics", () => {
    test("returns metrics for admin", async () => {
      const res = await fetch(`${baseUrl}/api/admin/metrics`, {
        headers: authHeaders(adminToken),
      });
      const body = await res.json();
      assert.equal(res.status, 200);
      assert.equal(body.success, true);
      assert.ok(body.data.totalUsers !== undefined);
      assert.ok(body.data.activeUsers !== undefined);
      assert.ok(body.data.trustDistribution !== undefined);
      assert.ok(body.data.platformControls !== undefined);
    });

    test("returns 403 for non-admin user", async () => {
      const res = await fetch(`${baseUrl}/api/admin/metrics`, {
        headers: authHeaders(userToken),
      });
      assert.equal(res.status, 403);
    });

    test("returns 401 without token", async () => {
      const res = await fetch(`${baseUrl}/api/admin/metrics`);
      assert.equal(res.status, 401);
    });
  });

  describe("GET /api/admin/users", () => {
    test("returns paginated user list for admin", async () => {
      const res = await fetch(`${baseUrl}/api/admin/users`, {
        headers: authHeaders(adminToken),
      });
      const body = await res.json();
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(body.data.users));
      assert.ok(body.data.total !== undefined);
      assert.equal(body.data.page, 1);
    });

    test("supports search query", async () => {
      const res = await fetch(`${baseUrl}/api/admin/users?search=test`, {
        headers: authHeaders(adminToken),
      });
      const body = await res.json();
      assert.equal(res.status, 200);
    });

    test("supports status filter", async () => {
      const res = await fetch(`${baseUrl}/api/admin/users?status=active`, {
        headers: authHeaders(adminToken),
      });
      const body = await res.json();
      assert.equal(res.status, 200);
    });

    test("returns 403 for non-admin", async () => {
      const res = await fetch(`${baseUrl}/api/admin/users`, {
        headers: authHeaders(userToken),
      });
      assert.equal(res.status, 403);
    });
  });

  describe("PATCH /api/admin/users/:id/status", () => {
    test("returns 404 for non-existent user", async () => {
      const res = await fetch(`${baseUrl}/api/admin/users/usr_nonexistent/status`, {
        method: "PATCH",
        headers: { ...authHeaders(adminToken), "Content-Type": "application/json" },
        body: JSON.stringify({ status: "suspended" }),
      });
      assert.equal(res.status, 404);
    });

    test("returns 403 for non-admin", async () => {
      const res = await fetch(`${baseUrl}/api/admin/users/usr_123/status`, {
        method: "PATCH",
        headers: { ...authHeaders(userToken), "Content-Type": "application/json" },
        body: JSON.stringify({ status: "suspended" }),
      });
      assert.equal(res.status, 403);
    });

    test("returns 400 for invalid status", async () => {
      const res = await fetch(`${baseUrl}/api/admin/users/usr_123/status`, {
        method: "PATCH",
        headers: { ...authHeaders(adminToken), "Content-Type": "application/json" },
        body: JSON.stringify({ status: "invalid" }),
      });
      assert.equal(res.status, 400);
    });

    test("returns 400 for missing status", async () => {
      const res = await fetch(`${baseUrl}/api/admin/users/usr_123/status`, {
        method: "PATCH",
        headers: { ...authHeaders(adminToken), "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 400);
    });
  });

  describe("GET /api/admin/controls", () => {
    test("returns platform controls", async () => {
      const res = await fetch(`${baseUrl}/api/admin/controls`, {
        headers: authHeaders(adminToken),
      });
      const body = await res.json();
      assert.equal(res.status, 200);
      assert.ok(body.data.registrationsEnabled !== undefined);
      assert.ok(body.data.jobPostingsEnabled !== undefined);
    });
  });

  describe("PATCH /api/admin/controls", () => {
    test("updates a control", async () => {
      const res = await fetch(`${baseUrl}/api/admin/controls`, {
        method: "PATCH",
        headers: { ...authHeaders(adminToken), "Content-Type": "application/json" },
        body: JSON.stringify({ control: "registrationsEnabled", value: false }),
      });
      const body = await res.json();
      assert.equal(res.status, 200);
      assert.equal(body.data.registrationsEnabled, false);
    });

    test("returns 400 for invalid control", async () => {
      const res = await fetch(`${baseUrl}/api/admin/controls`, {
        method: "PATCH",
        headers: { ...authHeaders(adminToken), "Content-Type": "application/json" },
        body: JSON.stringify({ control: "invalidControl", value: true }),
      });
      assert.equal(res.status, 400);
    });
  });

  describe("GET /api/admin/audit-log", () => {
    test("returns audit log entries", async () => {
      const res = await fetch(`${baseUrl}/api/admin/audit-log`, {
        headers: authHeaders(adminToken),
      });
      const body = await res.json();
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(body.data.entries));
    });

    test("supports pagination", async () => {
      const res = await fetch(`${baseUrl}/api/admin/audit-log?page=1&limit=10`, {
        headers: authHeaders(adminToken),
      });
      const body = await res.json();
      assert.equal(res.status, 200);
      assert.equal(body.data.page, 1);
      assert.equal(body.data.limit, 10);
    });
  });

  describe("POST /api/admin/disputes", () => {
    test("creates a dispute", async () => {
      const res = await fetch(`${baseUrl}/api/admin/disputes`, {
        method: "POST",
        headers: { ...authHeaders(adminToken), "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: "usr_client",
          freelancerId: "usr_freelancer",
          jobId: "job_123",
          reason: "Payment disagreement",
        }),
      });
      const body = await res.json();
      assert.equal(res.status, 201);
      assert.equal(body.data.status, "open");
      assert.ok(body.data.id);
    });

    test("returns 400 for missing required fields", async () => {
      const res = await fetch(`${baseUrl}/api/admin/disputes`, {
        method: "POST",
        headers: { ...authHeaders(adminToken), "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "test" }),
      });
      assert.equal(res.status, 400);
    });
  });

  describe("PATCH /api/admin/disputes/:id/rule", () => {
    test("rules in favor of client", async () => {
      // First create a dispute
      const createRes = await fetch(`${baseUrl}/api/admin/disputes`, {
        method: "POST",
        headers: { ...authHeaders(adminToken), "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: "usr_c",
          freelancerId: "usr_f",
          jobId: "job_x",
          reason: "test",
        }),
      });
      const created = await createRes.json();
      assert.equal(createRes.status, 201);
      const disputeId = created.data.id;

      const res = await fetch(`${baseUrl}/api/admin/disputes/${disputeId}/rule`, {
        method: "PATCH",
        headers: { ...authHeaders(adminToken), "Content-Type": "application/json" },
        body: JSON.stringify({ ruling: "client" }),
      });
      const body = await res.json();
      assert.equal(res.status, 200);
      assert.equal(body.data.status, "resolved");
      assert.equal(body.data.ruling.decision, "client");
    });

    test("returns 400 for invalid ruling", async () => {
      const res = await fetch(`${baseUrl}/api/admin/disputes/disp_999/rule`, {
        method: "PATCH",
        headers: { ...authHeaders(adminToken), "Content-Type": "application/json" },
        body: JSON.stringify({ ruling: "invalid" }),
      });
      assert.equal(res.status, 400);
    });
  });
});
