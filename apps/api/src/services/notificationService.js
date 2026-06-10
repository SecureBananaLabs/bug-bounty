import { snapshotRecord, snapshotRecords } from "../utils/snapshot.js";

const notifications = [];

export async function listNotifications() {
  return snapshotRecords(notifications);
}

export async function createNotification(payload) {
  const notification = snapshotRecord({ id: `ntf_${Date.now()}`, read: false, ...payload });
  notifications.push(notification);
  return snapshotRecord(notification);
}
