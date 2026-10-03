<content>
/**
 * Notification service
 */

const createNotification = (payload) => {
  // First copy the client-provided payload
  const notification = { ...payload };
  
  // Then assign server-owned fields, which cannot be overridden by the client
  notification.id = `ntf_${Date.now()}`;
  notification.read = false;
  
  return notification;
};

export { createNotification };
</content>