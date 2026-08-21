export function validateCreateNotification(payload) {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Invalid notification payload" };
  }
  const { userId, title, body } = payload;
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return { ok: false, error: "userId is required" };
  }
  if (!title || typeof title !== "string" || title.trim().length < 2) {
    return { ok: false, error: "Title must be at least 2 characters" };
  }
  if (!body || typeof body !== "string" || body.trim().length < 2) {
    return { ok: false, error: "Body must be at least 2 characters" };
  }
  return {
    ok: true,
    data: {
      userId: userId.trim(),
      title: title.trim(),
      body: body.trim()
    }
  };
}
