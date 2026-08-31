import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";
import { _clearManualPayouts } from "../services/adminService.js";

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

test("Admin manual payout suite", async (t) => {
  const app = createApp();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  t.beforeEach(() => {
    _clearManualPayouts();
  });

  t.after(() => {
    server.close();
  });

  await t.test("POST /api/admin/payouts/manual without auth returns 401 Unauthorized", async () => {
    const res = await makeRequest(server, {
      path: "/api/admin/payouts/manual",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }, { recipientId: "usr_123", amount: 100 });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  await t.test("POST /api/admin/payouts/manual with client role returns 403 Forbidden", async () => {
    const clientToken = signAccessToken({ id: "usr_client", role: "client" });
    const res = await makeRequest(server, {
      path: "/api/admin/payouts/manual",
      method: "POST",
      headers: {
        Authorization: `Bearer ${clientToken}`,
        "Content-Type": "application/json",
      },
    }, { recipientId: "usr_123", amount: 100 });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes("Forbidden"));
  });

  await t.test("POST /api/admin/payouts/manual with admin role and invalid body returns 400 Validation error", async () => {
    const adminToken = signAccessToken({ id: "usr_admin", role: "admin" });
    const res = await makeRequest(server, {
      path: "/api/admin/payouts/manual",
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
    }, { recipientId: "usr_123", amount: -50 });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Validation error");
  });

  await t.test("POST /api/admin/payouts/manual with admin role and valid body returns 201 Created", async () => {
    const adminToken = signAccessToken({ id: "usr_admin_1", role: "admin" });
    const res = await makeRequest(server, {
      path: "/api/admin/payouts/manual",
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
    }, {
      recipientId: "usr_freelancer_99",
      amount: 250,
      currency: "USDC",
      payoutMethod: "crypto_evm",
      destination: "0x1234567890123456789012345678901234567890",
      notes: "Manual payout for bounty completion in unsupported region"
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.payoutId.startsWith("pay_man_"));
    assert.equal(res.body.data.recipientId, "usr_freelancer_99");
    assert.equal(res.body.data.amount, 250);
    assert.equal(res.body.data.currency, "USDC");
    assert.equal(res.body.data.payoutMethod, "crypto_evm");
    assert.equal(res.body.data.status, "processed");
    assert.equal(res.body.data.processedBy, "usr_admin_1");
  });

  await t.test("GET /api/admin/payouts/manual lists processed records for admin", async () => {
    const adminToken = signAccessToken({ id: "usr_admin", role: "admin" });
    
    await makeRequest(server, {
      path: "/api/admin/payouts/manual",
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
    }, {
      recipientId: "usr_freelancer_1",
      amount: 75,
      currency: "EUR",
      payoutMethod: "paypal",
      destination: "user@example.com",
    });

    const res = await makeRequest(server, {
      path: "/api/admin/payouts/manual",
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].amount, 75);
    assert.equal(res.body.data[0].payoutMethod, "paypal");
  });
});
