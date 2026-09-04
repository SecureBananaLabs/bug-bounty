import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Payment API", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const jobUrl = `http://127.0.0.1:${port}/api/jobs`;
  const paymentUrl = `http://127.0.0.1:${port}/api/payments`;

  await t.test("POST /api/payments resolves payment amount server-side based on jobId", async () => {
    // 1. Create a job first
    const jobPayload = {
      title: "Develop high-performance REST API backend",
      description: "Looking for an expert to build and optimize Express REST APIs with TypeScript.",
      budgetMin: 500,
      budgetMax: 750,
      categoryId: "cat_backend",
      skills: ["Node.js", "Express", "Zod"]
    };

    const jobResponse = await fetch(jobUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jobPayload)
    });

    const jobData = await jobResponse.json();
    assert.equal(jobResponse.status, 201);
    const createdJobId = jobData.data.id;

    // 2. Create a payment intent using the jobId and check that the amount is set by the server
    const paymentPayload = {
      jobId: createdJobId,
      currency: "usd"
    };

    const paymentResponse = await fetch(paymentUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentPayload)
    });

    const paymentData = await paymentResponse.json();

    assert.equal(paymentResponse.status, 201);
    assert.ok(paymentData.data.paymentId.startsWith("pay_"));
    // The amount MUST equal job's budgetMax (750) rather than being specified by the client
    assert.equal(paymentData.data.amount, 750);
    assert.equal(paymentData.data.currency, "usd");
  });

  await t.test("POST /api/payments rejects unknown jobId", async () => {
    const paymentPayload = {
      jobId: "job_does_not_exist",
      currency: "usd"
    };

    const paymentResponse = await fetch(paymentUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentPayload)
    });

    assert.equal(paymentResponse.status, 500);
  });

  await t.test("POST /api/payments rejects missing jobId in payload", async () => {
    const paymentPayload = {
      currency: "usd"
    };

    const paymentResponse = await fetch(paymentUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentPayload)
    });

    assert.equal(paymentResponse.status, 400);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
