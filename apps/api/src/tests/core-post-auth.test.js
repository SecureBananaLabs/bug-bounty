import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    await run(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

const cases = [
  {
    path: "/api/proposals",
    payload: {
      jobId: "job_123",
      freelancerId: "usr_freelancer",
      coverLetter: "I can deliver this project quickly.",
      amount: 1200
    }
  },
  {
    path: "/api/reviews",
    payload: {
      contractId: "ctr_123",
      rating: 5,
      comment: "Fast delivery and clear communication."
    }
  },
  {
    path: "/api/messages",
    payload: {
      senderId: "usr_client",
      recipientId: "usr_freelancer",
      body: "Can you share an updated timeline?"
    }
  },
  {
    path: "/api/notifications",
    payload: {
      userId: "usr_client",
      type: "proposal",
      text: "A new proposal has arrived."
    }
  }
];

for (const testCase of cases) {
  test(`POST ${testCase.path} rejects missing token`, async () => {
    await withServer(async (port) => {
      const response = await fetch(`http://127.0.0.1:${port}${testCase.path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(testCase.payload)
      });
      const payload = await response.json();

      assert.equal(response.status, 401);
      assert.deepEqual(payload, {
        success: false,
        message: "Unauthorized"
      });
    });
  });

  test(`POST ${testCase.path} allows authenticated requests`, async () => {
    await withServer(async (port) => {
      const token = signAccessToken({ sub: "usr_auth", role: "client" });
      const response = await fetch(`http://127.0.0.1:${port}${testCase.path}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json"
        },
        body: JSON.stringify(testCase.payload)
      });
      const payload = await response.json();

      assert.equal(response.status, 201);
      assert.equal(payload.success, true);
      assert.equal(typeof payload.data.id, "string");

      for (const [key, value] of Object.entries(testCase.payload)) {
        assert.deepEqual(payload.data[key], value);
      }
    });
  });
}
