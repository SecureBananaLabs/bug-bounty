import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(baseUrl, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return {
    response,
    payload: await response.json()
  };
}

test("write endpoints reject malformed request bodies", async () => {
  await withServer(async (baseUrl) => {
    const cases = [
      {
        path: "/api/proposals",
        body: {
          coverLetter: "I can help with this project.",
          bidAmount: 0,
          estDuration: "2 weeks",
          jobId: "job_1",
          freelancerId: "usr_1"
        }
      },
      {
        path: "/api/reviews",
        body: {
          rating: 6,
          comment: "Great work",
          reviewerId: "usr_1",
          revieweeId: "usr_2"
        }
      },
      {
        path: "/api/messages",
        body: {
          body: "",
          senderId: "usr_1",
          receiverId: "usr_2"
        }
      },
      {
        path: "/api/notifications",
        body: {
          userId: "usr_1",
          title: "",
          body: "Payment received"
        }
      }
    ];

    for (const { path, body } of cases) {
      const { response, payload } = await postJson(baseUrl, path, body);

      assert.equal(response.status, 400, `${path} should reject malformed input`);
      assert.equal(payload.success, false);
      assert.equal(payload.message, "Validation failed");
    }
  });
});

test("write endpoints still accept valid request bodies", async () => {
  await withServer(async (baseUrl) => {
    const cases = [
      {
        path: "/api/proposals",
        body: {
          coverLetter: "I can help with this project.",
          bidAmount: 1200,
          estDuration: "2 weeks",
          jobId: "job_1",
          freelancerId: "usr_1"
        },
        idPrefix: "prp_"
      },
      {
        path: "/api/reviews",
        body: {
          rating: 5,
          comment: "Great work",
          reviewerId: "usr_1",
          revieweeId: "usr_2"
        },
        idPrefix: "rev_"
      },
      {
        path: "/api/messages",
        body: {
          body: "Hello",
          senderId: "usr_1",
          receiverId: "usr_2"
        },
        idPrefix: "msg_"
      },
      {
        path: "/api/notifications",
        body: {
          userId: "usr_1",
          title: "Payment",
          body: "Payment received"
        },
        idPrefix: "ntf_"
      }
    ];

    for (const { path, body, idPrefix } of cases) {
      const { response, payload } = await postJson(baseUrl, path, body);

      assert.equal(response.status, 201, `${path} should accept valid input`);
      assert.equal(payload.success, true);
      assert.ok(payload.data.id.startsWith(idPrefix));
    }
  });
});
