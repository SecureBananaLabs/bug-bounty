const messageService = require('../services/messageService');

class MessageController {
  async sendMessage(req, res, next) {
    try {
      const { senderId, receiverId, content, jobId } = req.body;
      const message = await messageService.sendMessage({ senderId, receiverId, content, jobId });
      res.status(201).json({ success: true, data: message });
    } catch (error) {
      if (error.statusCode === 400) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  async getMessages(req, res, next) {
    try {
      const { userId } = req.params;
      const messages = await messageService.getMessagesForUser(userId);
      res.json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  }

  async getConversation(req, res, next) {
    try {
      const { userId1, userId2 } = req.params;
      const messages = await messageService.getConversation(userId1, userId2);
      res.json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { messageId } = req.params;
      const { userId } = req.body;
      const message = await messageService.markAsRead(messageId, userId);
      if (!message) {
        return res.status(404).json({ success: false, error: 'Message not found or not authorized' });
      }
      res.json({ success: true, data: message });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const { userId } = req.params;
      const count = await messageService.getUnreadCount(userId);
      res.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MessageController();
