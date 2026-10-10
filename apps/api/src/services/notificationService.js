const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  // Extract server-owned fields from payload to prevent override
  const { id: _ignoredId, read: _ignoredRead, ...safePayload } = payload;
  
  const notification = { 
    id: `ntf_${Date.now()}`, 
    read: false, 
    ...safePayload 
  };
  
  notifications.push(notification);
  return notification;
}
