import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function startServer() {
  const app = createApp();
  const server = app.listen(0);
  return new Promise((resolve) => {
    server.once("listening", () => resolve(server));
  });
}

const VALID_JOB = {
  title: "Build a website",
  description: "Need a professional website built",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "web-dev",
  skills: ["javascript"],
};

async function postJob(server, body) {
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

test("post job with valid budget range succeeds", async () => {
  const server = await startServer();
  try {
    const { status, body } = await postJob(server, VALID_JOB);
    assert.equal(status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.budgetMin, 100);
    assert.equal(body.data.budgetMax, 500);
  } finally {
    server.close();
  }
});

test("post job with equal min and max succeeds", async () => {
  const server = await startServer();
  try {
    const { status, body } = await postJob(server, {
      ...VALID_JOB,
      budgetMin: 250,
      budgetMax: 250,
    });
    assert.equal(status, 201);
    assert.equal(body.success, true);
  } finally {
    server.close();
  }
});

test("post job with zero budget succeeds", async () => {
  const server = await startServer();
  try {
    const { status, body } = await postJob(server, {
      ...VALID_JOB,
      budgetMin: 0,
      budgetMax: 0,
    });
    assert.equal(status, 201);
    assert.equal(body.success, true);
  } finally {
    server.close();
  }
});

test("post job with inverted budget range is rejected", async () => {
  const server = await startServer();
  try {
    const { status, body } = await postJob(server, {
      ...VALID_JOB,
      budgetMin: 500,
      budgetMax: 100,
    });
    assert.equal(status, 400);
    assert.equal(body.success, false);
  } finally {
    server.close();
  }
});

test("post job with negative budgetMin is rejected", async () => {
  const server = await startServer();
  try {
    const { status } = await postJob(server, {
      ...VALID_JOB,
      budgetMin: -50,
      budgetMax: 200,
    });
    assert.equal(status, 400);
  } finally {
    server.close();
  }
});

test("post job with negative budgetMax is rejected", async () => {
  const server = await startServer();
  try {
    const { status } = await postJob(server, {
      ...VALID_JOB,
      budgetMin: 100,
      budgetMax: -10,
    });
    assert.equal(status, 400);
  } finally {
    server.close();
  }
});

test("post job missing title is rejected", async () => {
  const server = await startServer();
  try {
    const { status } = await postJob(server, {
      description: "Some description here please",
      budgetMin: 100,
      budgetMax: 200,
      categoryId: "web-dev",
    });
    assert.equal(status, 400);
  } finally {
    server.close();
  }
});

test("post job with short title is rejected", async () => {
  const server = await startServer();
  try {
    const { status } = await postJob(server, {
      ...VALID_JOB,
      title: "Hi",
    });
    assert.equal(status, 400);
  } finally {
    server.close();
  }
});
