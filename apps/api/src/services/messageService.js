const db = require('../config/db');

class MessageService {
  async sendMessage(senderId, receiverId, payload) {
    // Ensure client-supplied id is ignored; always use server-generated id
    const message = {
      id: `msg_${Date.now()}`,
      senderId,
      receiverId,
      content: payload.content,
      sentAt: new Date().toISOString()
    };

    const { error } = await db
      .from('messages')
      .insert(message);

    if (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }

    return message;
  }

  async getMessages(userId, otherUserId) {
    const { data, error } = await db
      .from('messages')
      .select('*')
      .or(`senderId.eq.${userId},receiverId.eq.${userId}`)
      .or(`senderId.eq.${otherUserId},receiverId.eq.${otherUserId}`)
      .order('sentAt', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return data;
  }
}

module.exports = new MessageService();
