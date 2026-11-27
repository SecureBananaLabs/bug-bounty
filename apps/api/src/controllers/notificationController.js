import { z } from "zod";
import { ok } from "../utils/response.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

export async function getNotifications(req, res) {
  return ok(res, await listNotifications());
}

const schema = z.object({}).passthrough();

export async function postNotification(req, res) {
  const payload = schema.parse(req.body);
  return ok(res, await createNotification(payload));
}
