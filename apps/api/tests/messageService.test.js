const messageService = require('../src/services/messageService');
const db = require('../src/config/db');

jest.mock('../src/config/db');

describe('MessageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should ignore client-supplied id and use server-generated id', async () => {
      const senderId = 'user_123';
      const receiverId = 'user_456';
      const payload = {
        id: 'client_provided_id_999',
        content: 'Hello!'
      };

      db.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      const result = await messageService.sendMessage(senderId, receiverId, payload);

      // Verify that the inserted message has a server-generated id (starts with 'msg_')
      expect(result.id).toMatch(/^msg_/);
      expect(result.id).not.toBe('client_provided_id_999');

      // Verify the insert was called with the correct object
      const insertMock = db.from().insert;
      expect(insertMock).toHaveBeenCalledTimes(1);
      const insertedMessage = insertMock.mock.calls[0][0];
      expect(insertedMessage.id).toMatch(/^msg_/);
      expect(insertedMessage.senderId).toBe(senderId);
      expect(insertedMessage.receiverId).toBe(receiverId);
      expect(insertedMessage.content).toBe('Hello!');
      expect(insertedMessage.sentAt).toBeDefined();
    });

    it('should preserve server-generated id even if payload has no id', async () => {
      const senderId = 'user_123';
      const receiverId = 'user_456';
      const payload = { content: 'Test message' };

      db.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      const result = await messageService.sendMessage(senderId, receiverId, payload);

      expect(result.id).toMatch(/^msg_/);
      expect(result.content).toBe('Test message');
    });

    it('should throw error if database insert fails', async () => {
      const senderId = 'user_123';
      const receiverId = 'user_456';
      const payload = { content: 'Hello!' };

      db.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: new Error('DB error') })
      });

      await expect(messageService.sendMessage(senderId, receiverId, payload)).rejects.toThrow('Failed to send message: DB error');
    });
  });
});
