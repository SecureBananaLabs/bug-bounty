import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { createApp } from "../app.js";
import { resetAdminData } from "../services/adminData.js";
import { signAccessToken } from "../utils/jwt.js";

beforeEach(() => {
  resetAdminData();
});

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await fn(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function authHeader(sub, role) {
  return {
    authorization: `Bearer ${signAccessToken({ sub, role })}`
  };
}

test("non-admins are denied access to admin routes", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
      headers: authHeader("usr_client_1", "client")
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Forbidden");
  });
});

test("admin user search and profile views work", async () => {
  await withServer(async (port) => {
    const listResponse = await fetch(
      `http://127.0.0.1:${port}/api/admin/users?role=client&status=active&search=Nora`,
      { headers: authHeader("usr_admin", "admin") }
    );
    const listPayload = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.equal(listPayload.success, true);
    assert.equal(listPayload.data.total, 1);
    assert.equal(listPayload.data.users[0].email, "nora.client@example.com");

    const profileResponse = await fetch(
      `http://127.0.0.1:${port}/api/admin/users/usr_client_1`,
      { headers: authHeader("usr_admin", "admin") }
    );
    const profilePayload = await profileResponse.json();

    assert.equal(profileResponse.status, 200);
    assert.equal(profilePayload.data.user.id, "usr_client_1");
    assert.ok(Array.isArray(profilePayload.data.jobs));
    assert.ok(Array.isArray(profilePayload.data.disputes));
  });
});

test("admin can suspend, reinstate, and ban users", async () => {
  await withServer(async (port) => {
    const suspendResponse = await fetch(
      `http://127.0.0.1:${port}/api/admin/users/usr_freelancer_1/suspend`,
      {
        method: "POST",
        headers: {
          ...authHeader("usr_admin", "admin"),
          "content-type": "application/json"
        },
        body: JSON.stringify({ reason: "Manual review" })
      }
    );
    const suspendPayload = await suspendResponse.json();

    assert.equal(suspendResponse.status, 200);
    assert.equal(suspendPayload.data.user.status, "suspended");
    assert.match(suspendPayload.data.notification.message, /Manual review/);

    const reinstateResponse = await fetch(
      `http://127.0.0.1:${port}/api/admin/users/usr_freelancer_1/reinstate`,
      {
        method: "POST",
        headers: authHeader("usr_admin", "admin")
      }
    );
    const reinstatePayload = await reinstateResponse.json();

    assert.equal(reinstateResponse.status, 200);
    assert.equal(reinstatePayload.data.user.status, "active");

    const banResponse = await fetch(`http://127.0.0.1:${port}/api/admin/users/usr_client_1/ban`, {
      method: "POST",
      headers: {
        ...authHeader("usr_admin", "admin"),
        "content-type": "application/json"
      },
      body: JSON.stringify({ reason: "Fraud risk" })
    });
    const banPayload = await banResponse.json();

    assert.equal(banResponse.status, 200);
    assert.equal(banPayload.data.user.status, "banned");
    assert.match(banPayload.data.notification.message, /Fraud risk/);
  });
});

test("flagged jobs can be approved, rejected, or escalated", async () => {
  await withServer(async (port) => {
    const queueResponse = await fetch(`http://127.0.0.1:${port}/api/admin/jobs/flagged`, {
      headers: authHeader("usr_admin", "admin")
    });
    const queuePayload = await queueResponse.json();

    assert.equal(queueResponse.status, 200);
    assert.equal(queuePayload.data.total, 2);

    const rejectResponse = await fetch(
      `http://127.0.0.1:${port}/api/admin/jobs/job_flagged_1/moderate`,
      {
        method: "POST",
        headers: {
          ...authHeader("usr_admin", "admin"),
          "content-type": "application/json"
        },
        body: JSON.stringify({ action: "reject", reason: "Policy violation" })
      }
    );
    const rejectPayload = await rejectResponse.json();

    assert.equal(rejectResponse.status, 200);
    assert.equal(rejectPayload.data.job.status, "rejected");
    assert.equal(rejectPayload.data.job.rejectionReason, "Policy violation");
    assert.match(rejectPayload.data.notification.message, /Policy violation/);

    const escalateResponse = await fetch(
      `http://127.0.0.1:${port}/api/admin/jobs/job_flagged_2/moderate`,
      {
        method: "PATCH",
        headers: {
          ...authHeader("usr_admin", "admin"),
          "content-type": "application/json"
        },
        body: JSON.stringify({ action: "escalate", reason: "Needs policy review" })
      }
    );
    const escalatePayload = await escalateResponse.json();

    assert.equal(escalateResponse.status, 200);
    assert.equal(escalatePayload.data.job.status, "escalated");

    const approveResponse = await fetch(
      `http://127.0.0.1:${port}/api/admin/jobs/job_flagged_2/moderate`,
      {
        method: "POST",
        headers: {
          ...authHeader("usr_admin", "admin"),
          "content-type": "application/json"
        },
        body: JSON.stringify({ action: "approve" })
      }
    );
    const approvePayload = await approveResponse.json();

    assert.equal(approveResponse.status, 200);
    assert.equal(approvePayload.data.job.status, "approved");
  });
});

test("dispute threads are viewable and can be resolved", async () => {
  await withServer(async (port) => {
    const detailResponse = await fetch(
      `http://127.0.0.1:${port}/api/admin/disputes/dsp_open_1`,
      { headers: authHeader("usr_admin", "admin") }
    );
    const detailPayload = await detailResponse.json();

    assert.equal(detailResponse.status, 200);
    assert.ok(Array.isArray(detailPayload.data.thread));
    assert.ok(Array.isArray(detailPayload.data.evidence));
    assert.ok(Array.isArray(detailPayload.data.transactions));

    const resolveResponse = await fetch(
      `http://127.0.0.1:${port}/api/admin/disputes/dsp_open_1/rule`,
      {
        method: "POST",
        headers: {
          ...authHeader("usr_admin", "admin"),
          "content-type": "application/json"
        },
        body: JSON.stringify({ decision: "seller", reason: "Evidence supports seller" })
      }
    );
    const resolvePayload = await resolveResponse.json();

    assert.equal(resolveResponse.status, 200);
    assert.equal(resolvePayload.data.status, "resolved");
    assert.equal(resolvePayload.data.resolution.ruledInFavorOf, "seller");
  });
});

test("platform metrics respect configurable ranges", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics?range=30d`, {
      headers: authHeader("usr_admin", "admin")
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.metrics.registeredUsers >= 1, true);
    assert.equal(payload.data.metrics.activeJobs >= 1, true);
    assert.equal(payload.data.metrics.revenue >= 0, true);
    assert.equal(payload.data.metrics.disputes >= 1, true);
  });
});
