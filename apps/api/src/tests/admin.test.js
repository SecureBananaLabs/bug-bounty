import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";

const token = jwt.sign({ sub: "admin_1", role: "admin" }, process.env.JWT_SECRET ?? "development-secret");
const userToken = jwt.sign({ sub: "client_1", role: "client" }, process.env.JWT_SECRET ?? "development-secret");

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("admin metrics are protected and return summary data", async () => {
  await withServer(async (baseUrl) => {
    const forbidden = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(forbidden.status, 401);

    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.totalUsers, 5);
    assert.equal(payload.data.flaggedListings, 1);
  });
});

test("non-admin tokens are forbidden from admin routes", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { authorization: `Bearer ${userToken}` }
    });

    assert.equal(response.status, 403);
  });
});

test("admin users endpoint supports pagination", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users?page=1&limit=2`, {
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.data.page, 1);
    assert.equal(payload.data.limit, 2);
    assert.equal(payload.data.total, 5);
    assert.equal(payload.data.items.length, 2);
  });
});

test("admin filters users by role and status", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users?role=freelancer&status=active`, {
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.data.total, 1);
    assert.equal(payload.data.items[0].id, "usr_1001");
  });
});

test("admin users endpoint supports search and join date filters", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/admin/users?query=ava&joinedAfter=2026-04-01&joinedBefore=2026-05-01`,
      {
        headers: { authorization: `Bearer ${token}` }
      }
    );

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.data.total, 1);
    assert.equal(payload.data.items[0].id, "usr_1003");
    assert.equal(payload.data.items[0].profile.headline, "Founder and product owner");
  });
});

test("admin user actions update status and write audit entries", async () => {
  await withServer(async (baseUrl) => {
    const actionResponse = await fetch(`${baseUrl}/api/admin/users/usr_1003`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ action: "ban" })
    });

    assert.equal(actionResponse.status, 200);
    const actionPayload = await actionResponse.json();
    assert.equal(actionPayload.data.status, "banned");

    const auditResponse = await fetch(`${baseUrl}/api/admin/audit-log?admin=admin_1&action=ban_user`, {
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(auditResponse.status, 200);
    const auditPayload = await auditResponse.json();
    assert.equal(auditPayload.data.total, 1);
    assert.match(auditPayload.data.items[0].detail, /usr_1003/);
  });
});

test("admin job rejection creates a notification", async () => {
  await withServer(async (baseUrl) => {
    const rejectResponse = await fetch(`${baseUrl}/api/admin/jobs/job_2001`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ action: "reject", reason: "Scope is unclear" })
    });

    assert.equal(rejectResponse.status, 200);

    const notificationsResponse = await fetch(`${baseUrl}/api/admin/notifications?recipient=Ava`, {
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(notificationsResponse.status, 200);
    const notificationsPayload = await notificationsResponse.json();
    assert.ok(notificationsPayload.data.total >= 1);
    assert.match(notificationsPayload.data.items[0].detail, /rejected/);
  });
});

test("admin dispute rulings surface thread and transaction details", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/disputes?page=1&limit=1`, {
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.ok(Array.isArray(payload.data.items[0].thread));
    assert.equal(payload.data.items[0].transaction.id, "txn_7001");
  });
});

test("admin audit log supports admin, action, and date range filters", async () => {
  await withServer(async (baseUrl) => {
    const actionResponse = await fetch(`${baseUrl}/api/admin/users/usr_1002`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ action: "ban" })
    });

    assert.equal(actionResponse.status, 200);

    const response = await fetch(
      `${baseUrl}/api/admin/audit-log?admin=admin_1&action=ban_user&from=2026-05-19T00:00:00Z&to=2026-05-21T00:00:00Z`,
      {
        headers: { authorization: `Bearer ${token}` }
      }
    );

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.ok(payload.data.total >= 1);
    assert.equal(payload.data.items[0].admin, "admin_1");
    assert.equal(payload.data.items[0].action, "ban_user");
    assert.ok(payload.data.items.some((item) => item.detail.includes("usr_1002")));
  });
});

test("admin settings endpoint supports read and update", async () => {
  await withServer(async (baseUrl) => {
    const readResponse = await fetch(`${baseUrl}/api/admin/settings`, {
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(readResponse.status, 200);
    const before = await readResponse.json();
    assert.equal(before.data.registrationsEnabled, true);

    const updateResponse = await fetch(`${baseUrl}/api/admin/settings`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ registrationsEnabled: false })
    });

    assert.equal(updateResponse.status, 200);
    const after = await updateResponse.json();
    assert.equal(after.data.registrationsEnabled, false);
  });
});
