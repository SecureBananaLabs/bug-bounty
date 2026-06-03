const messageService = require('../services/messageService');

class MessageController {
  async sendMessage(req, res, next) {
    try {
      const { senderId, receiverId, body } = req.body;
      const message = await messageService.sendMessage({ senderId, receiverId, body });
      res.status(201).json(message);
    } catch (err) {
      // Map service error for self-directed messages to HTTP 400
      if (err.statusCode === 400) {
        return res.status(400).json({ error: err.message });
      }
      next(err);
    }
  }

  async getMessages(req, res, next) {
    try {
      const { userId } = req.params;
      const messages = await messageService.getMessagesForUser(userId);
      res.json(messages);
    } catch (err) {
      next(err);
    }
  }

  async getConversation(req, res, next) {
    try {
      const { user1Id, user2Id } = req.params;
      const messages = await messageService.getConversation(user1Id, user2Id);
      res.json(messages);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MessageController();