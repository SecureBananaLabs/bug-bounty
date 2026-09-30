export function validateCreateMessage(payload) {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Invalid message payload" };
  }
  const { senderId, recipientId, content } = payload;
  if (!senderId || typeof senderId !== "string" || senderId.trim() === "") {
    return { ok: false, error: "senderId is required" };
  }
  if (!recipientId || typeof recipientId !== "string" || recipientId.trim() === "") {
    return { ok: false, error: "recipientId is required" };
  }
  if (!content || typeof content !== "string" || content.trim() === "") {
    return { ok: false, error: "content cannot be empty" };
  }
  return {
    ok: true,
    data: {
      ...payload,
      senderId: senderId.trim(),
      recipientId: recipientId.trim(),
      content: content.trim()
    }
  };
}
