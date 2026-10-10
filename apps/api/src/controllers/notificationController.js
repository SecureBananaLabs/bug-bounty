import { fail, ok } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  const { userId, title, body } = req.body ?? {};

  if (typeof userId !== "string" || userId.trim() === "") {
    return fail(res, "userId is required", 400);
  }

  if (typeof title !== "string" || title.trim() === "") {
    return fail(res, "title is required", 400);
  }

  if (typeof body !== "string" || body.trim() === "") {
    return fail(res, "body is required", 400);
  }

  return ok(res, await createNotification(req.body), 201);
}
