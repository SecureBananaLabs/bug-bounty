import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";
import {
  users,
  jobs,
  disputes,
  auditLog,
  platformControls,
  resetStore,
} from "../services/adminStore.js";

function buildApp() {
  return createApp();
}

async function listen(app) {
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  return server;
}

const adminToken = signAccessToken({ sub: "usr_4", role: "admin" });
const clientToken = signAccessToken({ sub: "usr_1", role: "client" });

test("GET /api/admin/metrics requires admin token (401 without)", async () => {
  resetStore();
  const server = await listen(buildApp());
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
  } finally {
    await close(server);
  }
});

test("GET /api/admin/metrics returns 403 for a non-admin (server-side role check)", async () => {
  resetStore();
  const server = await listen(buildApp());
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${clientToken}` },
    });
    assert.equal(res.status, 403);
  } finally {
    await close(server);
  }
});

test("GET /api/admin/metrics is served to an admin with trust distribution + summary cards", async () => {
  resetStore();
  const server = await listen(buildApp());
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    const m = body.data;
    assert.equal(m.totalUsers, users.length);
    assert.equal(m.activeJobs, 4); // OPEN + IN_PROGRESS (job_1, job_2, job_3, job_5)
    assert.equal(m.openDisputes, 2); // open + under_review
    assert.equal(m.flaggedListings, 3);
    assert.ok(typeof m.monthlyVolume === "number");
    assert.ok(m.trustScoreDistribution && typeof m.trustScoreDistribution === "object");
  } finally {
    await close(server);
  }
});

test("adminAuth verifies role server-side — forging role in token is not enough (different secret)", async () => {
  // A token signed with a different secret must be rejected even if it claims admin.
  const badToken = signAccessToken({ sub: "x", role: "admin" });
  // signAccessToken uses the real secret; to simulate forgery we tamper the payload.
  const tampered = badToken.split(".")[0] + "." + badToken.split(".")[1] + ".invalidsig";
  resetStore();
  const server = await listen(buildApp());
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${tampered}` },
    });
    assert.equal(res.status, 401);
  } finally {
    await close(server);
  }
});

test("GET /api/admin/users is paginated server-side (no full-table fetch)", async () => {
  resetStore();
  const server = await listen(buildApp());
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/users?pageSize=2&page=1`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.pageSize, 2);
    assert.equal(body.data.items.length, 2);
    assert.equal(body.data.total, users.length);
    assert.equal(body.data.page, 1);
    assert.equal(body.data.totalPages, Math.ceil(users.length / 2));
    assert.equal(body.data.hasNext, true);
  } finally {
    await close(server);
  }
});

test("GET /api/admin/users supports search + filter by role and status", async () => {
  resetStore();
  const server = await listen(buildApp());
  const { port } = server.address();
  try {
    const q = encodeURIComponent("alice");
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/users?search=${q}&role=client&status=active`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.items.length, 1);
    assert.equal(body.data.items[0].email, "alice@example.com");
  } finally {
    await close(server);
  }
});

test("PATCH /api/admin/users/:id/:action bans a user and writes to the audit log", async () => {
  resetStore();
  const server = await listen(buildApp());
  const { port } = server.address();
  const auditBefore = auditLog.length;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/users/usr_1/ban`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${adminToken}`, "content-type": "application/json" },
      body: JSON.stringify({ reason: "policy violation" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.status, "BANNED");
    assert.equal(auditLog.length, auditBefore + 1);
    const entry = auditLog[auditLog.length - 1];
    assert.equal(entry.action, "user_status_change");
    assert.equal(entry.adminId, "usr_4");
    assert.equal(entry.target, "usr_1");
    assert.equal(entry.meta.to, "BANNED");
  } finally {
    await close(server);
  }
});

test("GET /api/admin/jobs/flagged lists only flagged jobs (moderation queue)", async () => {
  resetStore();
  const server = await listen(buildApp());
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/jobs/flagged?pageSize=10`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.total, 3);
    assert.ok(body.data.items.every((j) => j.flagged === true));
  } finally {
    await close(server);
  }
});

test("PATCH /api/admin/jobs/:id/:decision rejects a listing and logs it", async () => {
  resetStore();
  const server = await listen(buildApp());
  const { port } = server.address();
  const before = auditLog.length;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/jobs/job_2/reject`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${adminToken}`, "content-type": "application/json" },
      body: JSON.stringify({ reason: "Duplicate listing" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.flagged, false);
    assert.equal(body.data.moderationStatus, "rejected");
    assert.equal(auditLog.length, before + 1);
    assert.equal(auditLog[auditLog.length - 1].action, "listing_moderation");
  } finally {
    await close(server);
  }
});

test("PATCH /api/admin/jobs/:invalid-decision returns 400", async () => {
  resetStore();
  const server = await listen(buildApp());
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/jobs/job_2/foo`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${adminToken}`, "content-type": "application/json" },
      body: JSON.stringify({ reason: "x" }),
    });
    assert.equal(res.status, 400);
  } finally {
    await close(server);
  }
});

test("GET /api/admin/disputes queue lists disputes with statuses", async () => {
  resetStore();
  const server = await listen(buildApp());
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/disputes`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.total, 2);
    const statuses = body.data.items.map((d) => d.status);
    assert.ok(statuses.includes("open"));
    assert.ok(statuses.includes("under_review"));
  } finally {
    await close(server);
  }
});

test("PATCH /api/admin/disputes/:id/resolve/:ruling resolves in favour of client and logs it", async () => {
  resetStore();
  const server = await listen(buildApp());
  const { port } = server.address();
  const before = auditLog.length;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/disputes/dis_1/resolve/client`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${adminToken}`, "content-type": "application/json" },
      body: JSON.stringify({ refund: true, reason: "client wins" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.status, "resolved");
    assert.deepEqual(body.data.resolution.inFavorOf, "client");
    assert.equal(auditLog.length, before + 1);
    assert.equal(auditLog[auditLog.length - 1].action, "dispute_resolution");
  } finally {
    await close(server);
  }
});

test("GET /api/admin/controls then PATCH toggles are logged with admin id + timestamp", async () => {
  resetStore();
  const server = await listen(buildApp());
  const { port } = server.address();
  const before = auditLog.length;
  try {
    let res = await fetch(`http://127.0.0.1:${port}/api/admin/controls`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    assert.equal(platformControls.registrationsEnabled, true);

    res = await fetch(`http://127.0.0.1:${port}/api/admin/controls`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${adminToken}`, "content-type": "application/json" },
      body: JSON.stringify({ registrationsEnabled: false, jobPostingsEnabled: true }),
    });
    assert.equal(res.status, 200);
    assert.equal(platformControls.registrationsEnabled, false);
    const entry = auditLog[auditLog.length - 1];
    assert.equal(entry.action, "platform_controls_update");
    assert.equal(entry.adminId, "usr_4");
    assert.ok(entry.createdAt); // timestamp
    assert.equal(auditLog.length, before + 1);
  } finally {
    await close(server);
  }
});

test("GET /api/admin/audit is filterable by action type and paginated", async () => {
  resetStore();
  // seed some actions
  const server = await listen(buildApp());
  const { port } = server.address();
  try {
    await fetch(`http://127.0.0.1:${port}/api/admin/users/usr_1/ban`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${adminToken}`, "content-type": "application/json" },
      body: JSON.stringify({ reason: "a" }),
    });
    await fetch(`http://127.0.0.1:${port}/api/admin/jobs/job_2/reject`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${adminToken}`, "content-type": "application/json" },
      body: JSON.stringify({ reason: "b" }),
    });

    const res = await fetch(`http://127.0.0.1:${port}/api/admin/audit?action=listing_moderation`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.items.length, 1);
    assert.equal(body.data.items[0].action, "listing_moderation");
  } finally {
    await close(server);
  }
});

test("All admin routes 403 for non-admins (route guard is global)", async () => {
  resetStore();
  const server = await listen(buildApp());
  const { port } = server.address();
  const routes = [
    ["/api/admin/metrics", "GET", null],
    ["/api/admin/users", "GET", null],
    ["/api/admin/jobs/flagged", "GET", null],
    ["/api/admin/disputes", "GET", null],
    ["/api/admin/controls", "GET", null],
    ["/api/admin/audit", "GET", null],
  ];
  for (const [path, method] of routes) {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: { authorization: `Bearer ${clientToken}` },
    });
    assert.equal(res.status, 403, `expected 403 for ${method} ${path}`);
  }
  await close(server);
});

async function close(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
