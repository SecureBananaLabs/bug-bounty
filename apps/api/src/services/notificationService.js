import { copyRecords } from "../utils/recordCopy.js";

const notifications = [];

export async function listNotifications() {
  return copyRecords(notifications);
}

export async function createNotification(payload) {
  const notification = { id: `ntf_${Date.now()}`, read: false, ...payload };
  notifications.push(notification);
  return notification;
}
