const db = require('../config/db');

class MessageService {
  /**
   * Send a message from one user to another.
   * @param {Object} payload - { senderId, receiverId, body }
   * @returns {Promise<Object>} The created message record.
   * @throws {Error} If senderId equals receiverId.
   */
  async sendMessage({ senderId, receiverId, body }) {
    // Reject self-directed messages
    if (senderId === receiverId) {
      const err = new Error('Sender and receiver must be different users');
      err.statusCode = 400;
      throw err;
    }

    const result = await db.query(
      'INSERT INTO messages (sender_id, receiver_id, body) VALUES ($1, $2, $3) RETURNING *',
      [senderId, receiverId, body]
    );
    return result.rows[0];
  }

  /**
   * Get messages for a user (sent or received).
   * @param {string} userId
   * @returns {Promise<Array>} List of messages.
   */
  async getMessagesForUser(userId) {
    const result = await db.query(
      'SELECT * FROM messages WHERE sender_id = $1 OR receiver_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  /**
   * Get a conversation between two users.
   * @param {string} user1Id
   * @param {string} user2Id
   * @returns {Promise<Array>} List of messages in the conversation.
   */
  async getConversation(user1Id, user2Id) {
    const result = await db.query(
      `SELECT * FROM messages 
       WHERE (sender_id = $1 AND receiver_id = $2) 
          OR (sender_id = $2 AND receiver_id = $1) 
       ORDER BY created_at ASC`,
      [user1Id, user2Id]
    );
    return result.rows;
  }
}

module.exports = new MessageService();