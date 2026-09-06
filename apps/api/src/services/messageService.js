const db = require('../config/db');

class MessageService {
  async sendMessage({ senderId, receiverId, content, jobId }) {
    if (!senderId || !receiverId || !content) {
      const error = new Error('senderId, receiverId, and content are required');
      error.statusCode = 400;
      throw error;
    }

    if (senderId === receiverId) {
      const error = new Error('Sender and receiver must be different users');
      error.statusCode = 400;
      throw error;
    }

    const result = await db.query(
      `INSERT INTO messages (sender_id, receiver_id, content, job_id, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [senderId, receiverId, content, jobId || null]
    );

    return result.rows[0];
  }

  async getMessagesForUser(userId) {
    const result = await db.query(
      `SELECT * FROM messages WHERE sender_id = $1 OR receiver_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async getConversation(userId1, userId2) {
    const result = await db.query(
      `SELECT * FROM messages WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1) ORDER BY created_at ASC`,
      [userId1, userId2]
    );
    return result.rows;
  }

  async markAsRead(messageId, userId) {
    const result = await db.query(
      `UPDATE messages SET read_at = NOW() WHERE id = $1 AND receiver_id = $2 RETURNING *`,
      [messageId, userId]
    );
    return result.rows[0];
  }

  async getUnreadCount(userId) {
    const result = await db.query(
      `SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND read_at IS NULL`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }
}

module.exports = new MessageService();
