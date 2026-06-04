const messageService = require('../services/messageService');

class MessageController {
  async sendMessage(req, res, next) {
    try {
      const { receiverId, content } = req.body;
      const senderId = req.user.id;

      if (!receiverId || !content) {
        return res.status(400).json({ error: 'receiverId and content are required' });
      }

      const message = await messageService.sendMessage(senderId, receiverId, { content });

      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req, res, next) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.id;

      const messages = await messageService.getMessages(currentUserId, userId);

      res.json(messages);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MessageController();
