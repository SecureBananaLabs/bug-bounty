import test from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import { errorHandler } from "../middleware/errorHandler.js";
import { postMessage } from "../controllers/messageController.js";
import { createMessageSchema } from "../validators/message.js";

const validMessage = {
  senderId: "usr_sender",
  receiverId: "usr_receiver",
  content: "Hello, I can help with this project."
};

test("createMessageSchema rejects empty message content", () => {
  const result = createMessageSchema.safeParse({
    ...validMessage,
    content: "   "
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path[0], "content");
});

test("createMessageSchema rejects oversized content", () => {
  const result = createMessageSchema.safeParse({
    ...validMessage,
    content: "a".repeat(5001)
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path[0], "content");
});

test("createMessageSchema rejects missing sender or receiver", () => {
  assert.equal(createMessageSchema.safeParse({ ...validMessage, senderId: "" }).success, false);
  assert.equal(createMessageSchema.safeParse({ ...validMessage, receiverId: "" }).success, false);
});

test("postMessage rejects invalid payloads before creating messages", async () => {
  await assert.rejects(
    () => postMessage(
      { body: { senderId: "usr_sender", receiverId: "usr_receiver", content: "" } },
      {}
    ),
    ZodError
  );
});

test("errorHandler returns 400 for Zod validation errors", () => {
  const error = createMessageSchema.safeParse({
    senderId: "usr_sender",
    receiverId: "usr_receiver",
    content: ""
  }).error;
  const response = {
    headersSent: false,
    statusCode: 0,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };

  errorHandler(error, {}, response, () => {});

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Validation failed");
  assert.equal(response.body.issues[0].path[0], "content");
});
