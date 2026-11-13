const notifications = [];

export async function listNotifications() {
  // Callers sort or splice what they receive, so the shared array has to be
  // handed over as an independent snapshot.
  return [...notifications];
}

export async function createNotification(payload) {
  const notification = { id: `ntf_${Date.now()}`, read: false, ...payload };
  notifications.push(notification);
  return notification;
}
