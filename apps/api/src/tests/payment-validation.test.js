import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createAuthMiddleware } from "../middleware/auth.js";
import { signAccessToken } from "../utils/jwt.js";

const existingUser = { id: "user-1", email: "member@example.test", role: "CLIENT" };

async function withServer(app, assertions) {
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    server.closeAllConnections?.();
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function appWithAuth({ token = "valid-token", user = existingUser } = {}) {
  let lookups = 0;
  const database = {
    user: {
      async findUnique({ where }) {
        lookups += 1;
        return where.id === user?.id ? user : null;
      }
    }
  };
  const paymentAuth = createAuthMiddleware({
    database,
    tokenVerifier(value) {
      if (value !== token) throw new Error("invalid token");
      return { sub: user?.id ?? "deleted-user" };
    }
  });

  return { app: createApp({ paymentAuth }), getLookups: () => lookups };
}

test("POST /api/payments requires a bearer token", async () => {
  const { app, getLookups } = appWithAuth();

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 125 })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.message, "Unauthorized");
    assert.equal(getLookups(), 0);
  });
});

test("POST /api/payments rejects invalid and deleted-user tokens", async () => {
  const { app, getLookups } = appWithAuth({ user: null });

  await withServer(app, async (baseUrl) => {
    const invalid = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        authorization: "Bearer forged-token",
        "content-type": "application/json"
      },
      body: JSON.stringify({ amount: 125 })
    });
    const deleted = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        authorization: "Bearer valid-token",
        "content-type": "application/json"
      },
      body: JSON.stringify({ amount: 125 })
    });

    assert.equal(invalid.status, 401);
    assert.equal(deleted.status, 401);
    assert.equal(getLookups(), 1);
  });
});

test("POST /api/payments accepts only a signed token for an existing user", async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-only-secret-with-at-least-32-bytes";
  try {
    const database = {
      user: {
        async findUnique({ where }) {
          return where.id === existingUser.id ? existingUser : null;
        }
      }
    };
    const paymentAuth = createAuthMiddleware({ database });
    const app = createApp({ paymentAuth });
    const token = signAccessToken({ sub: existingUser.id, role: "admin" });
    const [header, payload, signature] = token.split(".");
    const forgedToken = `${header}.${payload}.${signature[0] === "a" ? "b" : "a"}${signature.slice(1)}`;

    await withServer(app, async (baseUrl) => {
      const accepted = await fetch(`${baseUrl}/api/payments`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({ amount: 125 })
      });
      const forged = await fetch(`${baseUrl}/api/payments`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${forgedToken}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({ amount: 125 })
      });

      assert.equal(accepted.status, 201);
      assert.equal(forged.status, 401);
    });
  } finally {
    if (previousSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousSecret;
    }
  }
});

test("POST /api/payments rejects signed tokens without a subject claim", async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-only-secret-with-at-least-32-bytes";
  try {
    let lookups = 0;
    const paymentAuth = createAuthMiddleware({
      database: {
        user: {
          async findUnique() {
            lookups += 1;
            return existingUser;
          }
        }
      }
    });
    const app = createApp({ paymentAuth });
    const token = signAccessToken({ id: existingUser.id, role: "client" });

    await withServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/payments`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({ amount: 125 })
      });

      assert.equal(response.status, 401);
      assert.equal(lookups, 0);
    });
  } finally {
    if (previousSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousSecret;
    }
  }
});

test("registration rejects self-assigned admin roles", async () => {
  await withServer(createApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "admin@example.test",
        password: "test-password-123",
        fullName: "Test Admin",
        role: "admin"
      })
    });

    assert.equal(response.status, 400);
  });
});

test("POST /api/payments rejects invalid amounts and unsupported currencies", async () => {
  const { app } = appWithAuth();

  await withServer(app, async (baseUrl) => {
    const negative = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        authorization: "Bearer valid-token",
        "content-type": "application/json"
      },
      body: JSON.stringify({ amount: -10, currency: "usd" })
    });
    const unsupported = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        authorization: "Bearer valid-token",
        "content-type": "application/json"
      },
      body: JSON.stringify({ amount: 125, currency: "ZZZ" })
    });

    assert.equal(negative.status, 400);
    assert.equal(unsupported.status, 400);
  });
});

test("POST /api/payments normalizes valid input and defaults currency", async () => {
  const { app } = appWithAuth();

  await withServer(app, async (baseUrl) => {
    const normalized = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        authorization: "Bearer valid-token",
        "content-type": "application/json"
      },
      body: JSON.stringify({ amount: 125, currency: " INR " })
    });
    const defaulted = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        authorization: "Bearer valid-token",
        "content-type": "application/json"
      },
      body: JSON.stringify({ amount: 50 })
    });
    const normalizedPayload = await normalized.json();
    const defaultedPayload = await defaulted.json();

    assert.equal(normalized.status, 201);
    assert.equal(normalizedPayload.data.currency, "inr");
    assert.equal(defaulted.status, 201);
    assert.equal(defaultedPayload.data.currency, "usd");
  });
});

test("POST /api/payments rejects extra payment-detail fields", async () => {
  const { app } = appWithAuth();

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        authorization: "Bearer valid-token",
        "content-type": "application/json"
      },
      body: JSON.stringify({ amount: 125, bankAccount: "must-not-be-accepted" })
    });

    assert.equal(response.status, 400);
  });
});

test("POST /api/auth/refresh does not mint an unauthenticated token", async () => {
  await withServer(createApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/refresh`, { method: "POST" });
    const payload = await response.json();

    assert.equal(response.status, 501);
    assert.equal(payload.success, false);
    assert.equal(payload.data, undefined);
  });
});
