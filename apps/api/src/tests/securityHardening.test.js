import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { verifyAccessToken } from "../utils/jwt.js";

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

test("protected APIs reject unauthenticated callers", async () => {
  await withServer(async (baseUrl) => {
    const protectedGetEndpoints = [
      "/api/users",
      "/api/jobs",
      "/api/messages",
      "/api/reviews",
      "/api/proposals",
      "/api/notifications",
    ];

    const protectedPostEndpoints = [
      "/api/auth/refresh",
      "/api/payments",
      "/api/notifications",
      "/api/messages",
      "/api/reviews",
      "/api/proposals",
      "/api/uploads",
    ];

    for (const path of protectedGetEndpoints) {
      const response = await fetch(`${baseUrl}${path}`);
      const payload = await response.json();
      assert.equal(response.status, 401);
      assert.equal(payload.message, "Unauthorized");

      const postResponse = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "attempt" }),
      });
      const postPayload = await postResponse.json();
      assert.equal(postResponse.status, 401);
      assert.equal(postPayload.message, "Unauthorized");
    }

    for (const path of protectedPostEndpoints) {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "attempt" }),
      });
      const payload = await response.json();
      assert.equal(response.status, 401);
      assert.equal(payload.message, "Unauthorized");
    }

    const register = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "pay+notify@test.io", password: "password123" }),
    });
    const registerPayload = await register.json();
    const token = registerPayload.data?.token;
    assert.equal(register.status, 201);
    assert.ok(typeof token === "string" && token.length > 10);
    const registerClaim = verifyAccessToken(token);
    assert.equal(registerPayload.data.id, registerClaim.sub);

    const privilegedToken = token;

    const badUserEmail = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    const badUserEmailPayload = await badUserEmail.json();
    assert.equal(badUserEmail.status, 400);
    assert.equal(badUserEmailPayload.success, false);

    const badUserRole = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email: "user+hack@test.io", role: "admin", name: "ok" }),
    });
    const badUserRolePayload = await badUserRole.json();
    assert.equal(badUserRole.status, 400);
    assert.equal(badUserRolePayload.success, false);

    const deniedAdmin = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: {
        authorization: `Bearer ${privilegedToken}`,
      },
    });
    const deniedPayload = await deniedAdmin.json();
    assert.equal(deniedAdmin.status, 403);
    assert.equal(deniedPayload.message, "Forbidden");

    const paymentResponse = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount: 100, currency: "usd" }),
    });
    const paymentPayload = await paymentResponse.json();
    assert.equal(paymentResponse.status, 201);
    assert.equal(paymentPayload.success, true);
    assert.equal(paymentPayload.data.currency, "usd");

    const badPaymentAmount = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount: -10, currency: "usd" }),
    });
    const badPaymentAmountPayload = await badPaymentAmount.json();
    assert.equal(badPaymentAmount.status, 400);
    assert.equal(badPaymentAmountPayload.success, false);

    const badPaymentCurrency = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount: 120, currency: "btc" }),
    });
    const badPaymentCurrencyPayload = await badPaymentCurrency.json();
    assert.equal(badPaymentCurrency.status, 400);
    assert.equal(badPaymentCurrencyPayload.success, false);

    const uploadMissingResponse = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const uploadMissingPayload = await uploadMissingResponse.json();
    assert.equal(uploadMissingResponse.status, 400);
    assert.equal(uploadMissingPayload.success, false);
    assert.equal(uploadMissingPayload.message, "File is required");

    const notificationResponse = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "title-from-client",
      }),
    });
    const notificationPayload = await notificationResponse.json();
    assert.equal(notificationResponse.status, 201);
    assert.equal(notificationPayload.success, true);
    assert.equal(notificationPayload.data.read, false);
    assert.equal(notificationPayload.data.userId, registerClaim.sub);
    assert.ok(notificationPayload.data.id.startsWith("ntf_"));

    const messageResponse = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text: "hello from auth user",
      }),
    });
    const messagePayload = await messageResponse.json();
    assert.equal(messageResponse.status, 201);
    assert.equal(messagePayload.success, true);
    assert.ok(messagePayload.data.id.startsWith("msg_"));

    const badMessageResponse = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    const badMessagePayload = await badMessageResponse.json();
    assert.equal(badMessageResponse.status, 400);
    assert.equal(badMessagePayload.success, false);

    const badReviewResponse = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rating: 0, text: "x" }),
    });
    const badReviewPayload = await badReviewResponse.json();
    assert.equal(badReviewResponse.status, 400);
    assert.equal(badReviewPayload.success, false);

    const badProposalResponse = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ jobId: "", text: "", budgetMin: -1 }),
    });
    const badProposalPayload = await badProposalResponse.json();
    assert.equal(badProposalResponse.status, 400);
    assert.equal(badProposalPayload.success, false);

    const refreshResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const refreshPayload = await refreshResponse.json();
    assert.equal(refreshResponse.status, 200);
    assert.equal(typeof refreshPayload.data?.token, "string");
    const refreshedClaim = verifyAccessToken(refreshPayload.data.token);
    assert.equal(refreshedClaim.sub, registerClaim.sub);
    assert.equal(refreshedClaim.role, registerClaim.role);

    const searchMissing = await fetch(`${baseUrl}/api/search`);
    const searchMissingPayload = await searchMissing.json();
    assert.equal(searchMissing.status, 400);
    assert.ok(["Search query is required", "Required"].includes(searchMissingPayload.message));

    const searchLong = await fetch(`${baseUrl}/api/search?q=${"x".repeat(129)}`);
    const searchLongPayload = await searchLong.json();
    assert.equal(searchLong.status, 400);
    assert.equal(searchLongPayload.message, "Search query is too long");

    const searchValid = await fetch(`${baseUrl}/api/search?q=job`);
    const searchValidPayload = await searchValid.json();
    assert.equal(searchValid.status, 200);
    assert.equal(searchValidPayload.success, true);
    assert.equal(searchValidPayload.data.query, "job");
  });
});

test("notifications are scoped per user", async () => {
  await withServer(async (baseUrl) => {
    const registerUser = async (email) => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email, password: "password123" }),
      });
      const payload = await response.json();
      assert.equal(response.status, 201);
      assert.equal(payload.success, true);
      return payload.data.token;
    };

    const tokenA = await registerUser("a_scope@test.io");
    const tokenB = await registerUser("b_scope@test.io");

    const createNotif = async (token, title) => {
      const response = await fetch(`${baseUrl}/api/notifications`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });
      const payload = await response.json();
      assert.equal(response.status, 201);
      assert.equal(payload.success, true);
      return payload.data;
    };

    const notifA = await createNotif(tokenA, "A-title");
    const notifB = await createNotif(tokenB, "B-title");

    const listNotifications = async (token) => {
      const response = await fetch(`${baseUrl}/api/notifications`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      return payload.data;
    };

    const listA = await listNotifications(tokenA);
    const listB = await listNotifications(tokenB);

    const titlesA = new Set(listA.map((item) => item.title));
    const titlesB = new Set(listB.map((item) => item.title));

    assert.equal(listA.length, 1);
    assert.equal(listB.length, 1);
    assert.ok(titlesA.has(notifA.title));
    assert.ok(titlesB.has(notifB.title));
    assert.ok(!titlesA.has(notifB.title));
    assert.ok(!titlesB.has(notifA.title));
  });
});
