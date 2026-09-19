const notifications = [];

function serializeNotification(notification) {
  return { ...notification };
}

export async function listNotifications() {
  return notifications.map(serializeNotification);
}

export async function createNotification(payload) {
  const notification = { id: `ntf_${Date.now()}`, read: false, ...payload };
  notifications.push(notification);
  return serializeNotification(notification);
}
