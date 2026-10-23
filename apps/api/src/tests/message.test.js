import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

describe("POST /api/messages input validation", () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    const app = createApp();
    server = app.listen(0);
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}/api/messages`;
  });

  afterEach(async () => {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      server = null;
    }
  });

  it("valid message creation returns 201 and expected payload", async () => {
    const payload = {
      senderId: "usr_sender_001",
      receiverId: "usr_receiver_002",
      content: "Hello, this is a valid message."
    };

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    assert.equal(response.status, 201);
    assert.equal(data.success, true);
    assert.ok(data.data.id);
    assert.equal(data.data.senderId, payload.senderId);
    assert.equal(data.data.receiverId, payload.receiverId);
    assert.equal(data.data.content, payload.content);
    assert.ok(data.data.sentAt);
  });

  it("missing senderId returns 400", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: "usr_receiver_002",
        content: "Missing sender"
      })
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
    assert.ok(data.issues.some((i) => i.path.includes("senderId")));
  });

  it("blank senderId returns 400", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: "   ",
        receiverId: "usr_receiver_002",
        content: "Blank sender"
      })
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
    assert.ok(data.issues.some((i) => i.path.includes("senderId")));
  });

  it("missing receiverId returns 400", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: "usr_sender_001",
        content: "Missing receiver"
      })
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
    assert.ok(data.issues.some((i) => i.path.includes("receiverId")));
  });

  it("blank receiverId returns 400", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: "usr_sender_001",
        receiverId: "   ",
        content: "Blank receiver"
      })
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
    assert.ok(data.issues.some((i) => i.path.includes("receiverId")));
  });

  it("missing content returns 400", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: "usr_sender_001",
        receiverId: "usr_receiver_002"
      })
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
    assert.ok(data.issues.some((i) => i.path.includes("content")));
  });

  it("blank content returns 400", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: "usr_sender_001",
        receiverId: "usr_receiver_002",
        content: ""
      })
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
    assert.ok(data.issues.some((i) => i.path.includes("content")));
  });

  it("whitespace-only content returns 400", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: "usr_sender_001",
        receiverId: "usr_receiver_002",
        content: "    \t \n  "
      })
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
    assert.ok(data.issues.some((i) => i.path.includes("content")));
  });

  it("content exceeding 5000 characters returns 400", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: "usr_sender_001",
        receiverId: "usr_receiver_002",
        content: "x".repeat(5001)
      })
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
    assert.ok(data.issues.some((i) => i.path.includes("content")));
  });

  it("content exactly at 5000 characters returns 201", async () => {
    const payload = {
      senderId: "usr_sender_001",
      receiverId: "usr_receiver_002",
      content: "x".repeat(5000)
    };
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    assert.equal(response.status, 201);
    assert.equal(data.success, true);
    assert.equal(data.data.content.length, 5000);
  });

  it("strips unrecognized fields from message payload", async () => {
    const payload = {
      senderId: "usr_sender_001",
      receiverId: "usr_receiver_002",
      content: "Valid content",
      injectedField: "malicious_payload",
      isAdmin: true
    };
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    assert.equal(response.status, 201);
    assert.equal(data.success, true);
    assert.equal(data.data.injectedField, undefined);
    assert.equal(data.data.isAdmin, undefined);
  });
});

