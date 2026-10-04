<content>
const { sendMessage, getMessagesByUserId } = require('../services/messageService');
const { createMessagePayloadSchema } = require('../validations/messageValidation');

// Controller for handling message-related requests
const messageController = {
  /**
   * Sends a new message.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   */
  async send(req, res) {
    try {
      // The schema validation is now handled inside the service.
      // The controller's role is to pass the request body and handle the response.
      const newMessage = await sendMessage(req.body);
      res.status(201).json(newMessage);
    } catch (error) {
      // Zod errors are thrown with a status of 400
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      // Handle other potential errors
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * Gets all messages for a specific user.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   */
  async getByUserId(req, res) {
    try {
      const { userId } = req.params;
      const messages = await getMessagesByUserId(userId);
      res.json(messages);
    } catch (error) {
      console.error('Error getting messages by user ID:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

module.exports = messageController;
</content>