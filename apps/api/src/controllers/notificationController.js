import { ok } from "../utils/response.js";
import { z } from "zod";
import { createNotification, listNotifications } from "../services/notificationService.js";

const notificationSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000)
});

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

export async function postNotification(req, res) {
  const payload = notificationSchema.parse(req.body);
  return ok(res, await createNotification(payload), 201);
}
