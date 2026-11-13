import { getDb } from "../config/prisma.js";
import { ensureUser, mapNotification, nextId } from "./persistenceHelpers.js";

export async function listNotifications() {
  const db = getDb();
  const notifications = await db.notification.findMany({
    orderBy: { createdAt: "asc" }
  });

  return notifications.map(mapNotification);
}

export async function createNotification(payload) {
  const db = getDb();
  const id = nextId("ntf", payload.id);
  const userId = payload.userId ?? "usr_placeholder_notify";

  await ensureUser(userId);

  const notification = await db.notification.create({
    data: {
      id,
      userId,
      title: payload.title ?? payload.type ?? "notification",
      body: payload.body ?? payload.message ?? "",
      read: false
    }
  });

  return mapNotification(notification);
}
