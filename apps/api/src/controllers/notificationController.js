import { z } from "zod";
import { ok } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

const schema = z.object({ userId: z.string().min(1), type: z.string().min(1), message: z.string().min(1) }).strict();

export async function postNotification(req, res) {
  let payload;
  try {
    payload = schema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ success: false, message: "Validation failed" });
  }
  return ok(res, await createNotification(payload));
}
