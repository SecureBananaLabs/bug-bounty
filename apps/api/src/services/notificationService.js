import { cloneRecord, cloneRecords } from "../utils/records.js";

const notifications = [];

export async function listNotifications() {
  return cloneRecords(notifications);
}

export async function createNotification(payload) {
  const notification = { id: `ntf_${Date.now()}`, read: false, ...payload };
  notifications.push(notification);
  return cloneRecord(notification);
}
