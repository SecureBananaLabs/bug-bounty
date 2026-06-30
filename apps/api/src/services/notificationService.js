const notifications = [];

export async function listNotifications() {
  // Return a shallow copy — callers cannot mutate the in-memory store.
  return [...notifications];
}

export async function createNotification(payload) {
  // Server-controlled fields must come AFTER the spread so the client
  // cannot override them. Previously id and read were BEFORE the spread,
  // allowing { read: true } in the payload to silently mark notifications
  // as already-read on creation, defeating unread notification counts.
  const notification = {
    ...payload,
    id: `ntf_${Date.now()}`,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(notification);
  return notification;
}
