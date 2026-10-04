<content>
const { createNotification } = require('../services/notificationService');
const { createNotificationPayloadSchema } = require('../validations/notificationValidation');

// Controller for handling notification-related requests
const notificationController = {
  /**
   * Creates a new notification.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   */
  async create(req, res) {
    try {
      // The schema validation is now handled inside the service.
      // The controller's role is to pass the request body and handle the response.
      const newNotification = await createNotification(req.body);
      res.status(201).json(newNotification);
    } catch (error) {
      // Zod errors are thrown with a status of 400
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      // Handle other potential errors
      console.error('Error creating notification:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * Marks a notification as read.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   */
  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const updatedNotification = await markAsRead(notificationId); // Assuming this function is exported from the service
      if (!updatedNotification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json(updatedNotification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

// Helper function to be used by the controller
async function markAsRead(notificationId) {
  // This would typically call the service function
  // For this example, we assume the service function is directly available or imported.
  // const { markAsRead } = require('../services/notificationService');
  // return await markAsRead(notificationId);
  return { id: notificationId, read: true }; // Placeholder
}


module.exports = notificationController;
</content>