const request = require('supertest');
const app = require('../../src/app');
const messageService = require('../../src/services/messageService');

jest.mock('../../src/services/messageService');

describe('POST /api/messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 when senderId equals receiverId', async () => {
    const payload = {
      senderId: 'user1',
      receiverId: 'user1',
      content: 'Self message'
    };

    messageService.sendMessage.mockRejectedValue({
      message: 'Sender and receiver must be different users',
      statusCode: 400
    });

    const response = await request(app)
      .post('/api/messages')
      .send(payload)
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: 'Sender and receiver must be different users'
    });
  });

  it('should return 201 for valid messages between different users', async () => {
    const payload = {
      senderId: 'user1',
      receiverId: 'user2',
      content: 'Hello'
    };

    const mockMessage = {
      id: 1,
      sender_id: 'user1',
      receiver_id: 'user2',
      content: 'Hello',
      job_id: null,
      created_at: new Date().toISOString()
    };

    messageService.sendMessage.mockResolvedValue(mockMessage);

    const response = await request(app)
      .post('/api/messages')
      .send(payload)
      .expect(201);

    expect(response.body).toEqual({
      success: true,
      data: mockMessage
    });
  });

  it('should return 400 when required fields are missing', async () => {
    const payload = {
      senderId: 'user1'
      // missing receiverId and content
    };

    messageService.sendMessage.mockRejectedValue({
      message: 'senderId, receiverId, and content are required',
      statusCode: 400
    });

    const response = await request(app)
      .post('/api/messages')
      .send(payload)
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: 'senderId, receiverId, and content are required'
    });
  });
});
