import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "../app";
import * as messageService from "../services/messageService";

describe("POST /api/messages", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    messageService.clearMessagesForTests();
  });

  it("accepts and persists a valid message payload", async () => {
    const sendMessageSpy = vi.spyOn(messageService, "sendMessage");

    const response = await request(app)
      .post("/api/messages")
      .send({
        senderId: "user-a",
        receiverId: "user-b",
        conversationId: "conversation-1",
        content: "Hello from the validated route.",
      })
      .expect(201);

    expect(response.body.data).toMatchObject({
      senderId: "user-a",
      receiverId: "user-b",
      conversationId: "conversation-1",
      content: "Hello from the validated route.",
    });
    expect(response.body.data.id).toEqual(expect.any(String));
    expect(response.body.data.createdAt).toEqual(expect.any(String));
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      "senderId is missing",
      {
        receiverId: "user-b",
        content: "Hello",
      },
    ],
    [
      "receiverId is missing",
      {
        senderId: "user-a",
        content: "Hello",
      },
    ],
    [
      "content is missing",
      {
        senderId: "user-a",
        receiverId: "user-b",
      },
    ],
  ])("returns 400 when %s", async (_description, body) => {
    const sendMessageSpy = vi.spyOn(messageService, "sendMessage");

    const response = await request(app)
      .post("/api/messages")
      .send(body)
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_MESSAGE_PAYLOAD");
    expect(response.body.error.details).toEqual(expect.any(Array));
    expect(sendMessageSpy).not.toHaveBeenCalled();
  });

  it.each([
    ["empty content", ""],
    ["whitespace-only content", "   \n\t  "],
    ["oversized content", "x".repeat(5001)],
  ])("returns 400 for %s", async (_description, content) => {
    const sendMessageSpy = vi.spyOn(messageService, "sendMessage");

    const response = await request(app)
      .post("/api/messages")
      .send({
        senderId: "user-a",
        receiverId: "user-b",
        content,
      })
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_MESSAGE_PAYLOAD");
    expect(sendMessageSpy).not.toHaveBeenCalled();
  });

  it("rejects unknown properties before persistence", async () => {
    const sendMessageSpy = vi.spyOn(messageService, "sendMessage");

    const response = await request(app)
      .post("/api/messages")
      .send({
        senderId: "user-a",
        receiverId: "user-b",
        content: "Valid body with invalid extra field.",
        unexpectedField: "must be rejected",
      })
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_MESSAGE_PAYLOAD");
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "unrecognized_keys",
        }),
      ]),
    );
    expect(sendMessageSpy).not.toHaveBeenCalled();
  });

  it("rejects prototype-pollution-shaped keys before persistence", async () => {
    const sendMessageSpy = vi.spyOn(messageService, "sendMessage");

    const response = await request(app)
      .post("/api/messages")
      .set("Content-Type", "application/json")
      .send(
        '{"senderId":"user-a","receiverId":"user-b","content":"Hello",' +
          '"__proto__":{"polluted":true}}',
      )
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_MESSAGE_PAYLOAD");
    expect(sendMessageSpy).not.toHaveBeenCalled();
  });

  it("accepts a payload without optional conversationId", async () => {
    const response = await request(app)
      .post("/api/messages")
      .send({
        senderId: "user-a",
        receiverId: "user-b",
        content: "Standalone message.",
      })
      .expect(201);

    expect(response.body.data).toMatchObject({
      senderId: "user-a",
      receiverId: "user-b",
      content: "Standalone message.",
    });
    expect(response.body.data.conversationId).toBeUndefined();
  });
});
