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
    const lowercaseBearerUsers = await fetch(`${baseUrl}/api/users`, {
      headers: {
        authorization: `bearer ${token}`,
      },
    });
    const lowercaseBearerPayload = await lowercaseBearerUsers.json();
    assert.equal(lowercaseBearerUsers.status, 200);
    assert.equal(lowercaseBearerPayload.success, true);

    const registerClaim = verifyAccessToken(token);
    assert.equal(registerPayload.data.id, registerClaim.sub);

    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: "pay+notify@test.io", password: "password123" }),
    });
    const loginPayload = await login.json();
    assert.equal(login.status, 200);
    assert.equal(loginPayload.success, true);
    const loginClaim = verifyAccessToken(loginPayload.data.token);
    assert.equal(loginPayload.data.id, registerClaim.sub);
    assert.equal(loginClaim.sub, registerClaim.sub);

    const duplicateRegister = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: "pay+notify@test.io", password: "password123" }),
    });
    const duplicateRegisterPayload = await duplicateRegister.json();
    assert.equal(duplicateRegister.status, 409);
    assert.equal(duplicateRegisterPayload.success, false);

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
    assert.equal(typeof notificationPayload.data.createdAt, "string");
    assert.ok(notificationPayload.data.createdAt.length > 1);

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

    const jobResponse = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "timestamp audit",
        description: "Add createdAt field to API create payload for auditing",
        budgetMin: 120,
        budgetMax: 220,
        categoryId: "dev",
        skills: ["node", "api"],
      }),
    });
    const jobPayload = await jobResponse.json();
    assert.equal(jobResponse.status, 201);
    assert.equal(jobPayload.success, true);
    assert.equal(typeof jobPayload.data.createdAt, "string");
    assert.ok(jobPayload.data.createdAt.length > 1);

    const proposalResponse = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        jobId: jobPayload.data.id,
        text: "I will implement a small scoped API hardening fix",
        budgetMin: 75,
      }),
    });
    const proposalPayload = await proposalResponse.json();
    assert.equal(proposalResponse.status, 201);
    assert.equal(proposalPayload.success, true);
    assert.equal(typeof proposalPayload.data.createdAt, "string");
    assert.ok(proposalPayload.data.createdAt.length > 1);

    const searchUserResponse = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: "search-target@securebanana.test",
        name: "Search Auditor",
      }),
    });
    const searchUserPayload = await searchUserResponse.json();
    assert.equal(searchUserResponse.status, 201);
    assert.equal(searchUserPayload.success, true);
    assert.ok(typeof searchUserPayload.data.id === "string" && searchUserPayload.data.id.startsWith("usr_"));

    const reviewResponse = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        rating: 5,
        text: "Looks good from a security-hardening perspective",
      }),
    });
    const reviewPayload = await reviewResponse.json();
    assert.equal(reviewResponse.status, 201);
    assert.equal(reviewPayload.success, true);
    assert.equal(typeof reviewPayload.data.createdAt, "string");
    assert.ok(reviewPayload.data.createdAt.length > 1);

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

    const badJobResponse = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "job",
        description: "this is a valid description",
        budgetMin: 200,
        budgetMax: 100,
        categoryId: "dev",
        skills: [],
      }),
    });
    const badJobPayload = await badJobResponse.json();
    assert.equal(badJobResponse.status, 400);
    assert.equal(badJobPayload.success, false);

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

    const searchValid = await fetch(`${baseUrl}/api/search?q=timestamp`);
    const searchValidPayload = await searchValid.json();
    assert.equal(searchValid.status, 200);
    assert.equal(searchValidPayload.success, true);
    assert.equal(searchValidPayload.data.query, "timestamp");
    assert.ok(Array.isArray(searchValidPayload.data.jobs));
    assert.ok(Array.isArray(searchValidPayload.data.users));
    assert.ok(searchValidPayload.data.jobs.some((item) => item.id === jobPayload.data.id));

    const userSearch = await fetch(`${baseUrl}/api/search?q=search+auditor`);
    const userSearchPayload = await userSearch.json();
    assert.equal(userSearch.status, 200);
    assert.equal(userSearchPayload.success, true);
    assert.equal(userSearchPayload.data.query, "search auditor");
    assert.ok(
      userSearchPayload.data.users.some((item) => item.id === searchUserPayload.data.id)
    );

    const oauthMissingCode = await fetch(`${baseUrl}/api/auth/oauth/github/callback`);
    const oauthMissingCodePayload = await oauthMissingCode.json();
    assert.equal(oauthMissingCode.status, 400);
    assert.equal(oauthMissingCodePayload.success, false);

    const oauthInvalidProvider = await fetch(`${baseUrl}/api/auth/oauth/unknown/callback?code=abc12345`);
    const oauthInvalidProviderPayload = await oauthInvalidProvider.json();
    assert.equal(oauthInvalidProvider.status, 400);
    assert.equal(oauthInvalidProviderPayload.success, false);

    const oauthOk = await fetch(`${baseUrl}/api/auth/oauth/github/callback?code=validOAuthCode123`);
    const oauthOkPayload = await oauthOk.json();
    assert.equal(oauthOk.status, 200);
    assert.equal(oauthOkPayload.success, true);
    assert.equal(oauthOkPayload.data.provider, "github");
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

test("unknown routes return JSON 404 responses", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/does-not-exist`);
    const payload = await response.json();

    assert.equal(response.status, 404);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Route not found");
  });
});
