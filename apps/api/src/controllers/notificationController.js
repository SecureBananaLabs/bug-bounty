import { ok } from "../utils/response.js";
import { createNotification, getNotificationById, listNotifications } from "../services/notificationService.js";

export async function getNotifications(req, res, next) {
  try {
    return ok(res, await listNotifications());
  } catch (err) {
    next(err);
  }
}

export async function getNotification(req, res, next) {
  try {
    const notification = await getNotificationById(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }
    return ok(res, notification);
  } catch (err) {
    next(err);
  }
}

export async function postNotification(req, res, next) {
  try {
    return ok(res, await createNotification(req.body), 201);
  } catch (err) {
    next(err);
  }
}
