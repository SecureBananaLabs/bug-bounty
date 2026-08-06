const messageService = require('../../src/services/messageService');
const db = require('../../src/config/db');

jest.mock('../../src/config/db');

describe('MessageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should reject self-directed messages with a 400 error', async () => {
      const payload = {
        senderId: 'user1',
        receiverId: 'user1',
        content: 'Hello to myself'
      };

      await expect(messageService.sendMessage(payload)).rejects.toThrow('Sender and receiver must be different users');

      try {
        await messageService.sendMessage(payload);
      } catch (error) {
        expect(error.statusCode).toBe(400);
      }

      expect(db.query).not.toHaveBeenCalled();
    });

    it('should allow messages between different users', async () => {
      const mockMessage = {
        id: 1,
        sender_id: 'user1',
        receiver_id: 'user2',
        content: 'Hello',
        job_id: null,
        created_at: new Date()
      };

      db.query.mockResolvedValue({ rows: [mockMessage] });

      const payload = {
        senderId: 'user1',
        receiverId: 'user2',
        content: 'Hello'
      };

      const result = await messageService.sendMessage(payload);

      expect(result).toEqual(mockMessage);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO messages'),
        ['user1', 'user2', 'Hello', null]
      );
    });

    it('should reject missing required fields', async () => {
      const payload = {
        senderId: 'user1',
        receiverId: 'user2'
        // missing content
      };

      await expect(messageService.sendMessage(payload)).rejects.toThrow('senderId, receiverId, and content are required');
    });
  });
});
