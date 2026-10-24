const notifications = [];

export async function listNotifications() {
  // Callers mark notifications read on the array they receive, so hand them a
  // snapshot instead of the array the service itself keeps appending to.
  return [...notifications];
}

export async function createNotification(payload) {
  const notification = { id: `ntf_${Date.now()}`, read: false, ...payload };
  notifications.push(notification);
  return notification;
}
