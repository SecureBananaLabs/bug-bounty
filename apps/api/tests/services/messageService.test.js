const messageService = require('../../src/services/messageService');
const db = require('../../src/config/db');

// Mock the database module
jest.mock('../../src/config/db');

describe('MessageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should reject self-directed messages (senderId === receiverId)', async () => {
      const payload = {
        senderId: 'usr_123',
        receiverId: 'usr_123',
        body: 'hello myself'
      };

      await expect(messageService.sendMessage(payload)).rejects.toThrow(
        'Sender and receiver must be different users'
      );

      // Ensure no database query was made
      expect(db.query).not.toHaveBeenCalled();
    });

    it('should accept messages with different sender and receiver', async () => {
      const payload = {
        senderId: 'usr_123',
        receiverId: 'usr_456',
        body: 'hello there'
      };

      const mockResult = {
        rows: [{
          id: 1,
          sender_id: 'usr_123',
          receiver_id: 'usr_456',
          body: 'hello there',
          created_at: new Date()
        }]
      };

      db.query.mockResolvedValue(mockResult);

      const result = await messageService.sendMessage(payload);

      expect(result).toEqual(mockResult.rows[0]);
      expect(db.query).toHaveBeenCalledWith(
        'INSERT INTO messages (sender_id, receiver_id, body) VALUES ($1, $2, $3) RETURNING *',
        ['usr_123', 'usr_456', 'hello there']
      );
    });

    it('should throw error with statusCode 400 for self-directed messages', async () => {
      const payload = {
        senderId: 'usr_abc',
        receiverId: 'usr_abc',
        body: 'test'
      };

      try {
        await messageService.sendMessage(payload);
        fail('Expected error was not thrown');
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.message).toBe('Sender and receiver must be different users');
      }
    });
  });
});