import { ok } from "../utils/response.js";
import { listNotifications, createNotification } from "../services/notificationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getNotifications = asyncHandler(async (req, res) => {
  return ok(res, await listNotifications());
});

export const postNotification = asyncHandler(async (req, res) => {
  return ok(res, await createNotification(req.body), 201);
});
