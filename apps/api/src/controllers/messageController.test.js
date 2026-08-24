import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { postMessage } from "./messageController.js";

function mockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

describe("Message Controller Validation (#11724)", () => {
  it("rejects message creation with missing senderId (400)", async () => {
    const req = { body: { recipientId: "user_2", content: "Hello there" } };
    const res = mockRes();
    await postMessage(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
  });

  it("rejects message creation with missing recipientId (400)", async () => {
    const req = { body: { senderId: "user_1", content: "Hello there" } };
    const res = mockRes();
    await postMessage(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
  });

  it("rejects message creation with empty/whitespace content (400)", async () => {
    const req = { body: { senderId: "user_1", recipientId: "user_2", content: "   " } };
    const res = mockRes();
    await postMessage(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
  });

  it("successfully creates message with valid payload (201)", async () => {
    const req = { body: { senderId: "user_1", recipientId: "user_2", content: "Hello there" } };
    const res = mockRes();
    await postMessage(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.senderId, "user_1");
    assert.equal(res.body.data.recipientId, "user_2");
    assert.equal(res.body.data.content, "Hello there");
  });
});
