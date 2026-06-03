const request = require('supertest');
const app = require('../../src/app');
const messageService = require('../../src/services/messageService');

// Mock the message service
jest.mock('../../src/services/messageService');

describe('POST /api/messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 when senderId equals receiverId', async () => {
    // Make the service throw the self-directed error
    messageService.sendMessage.mockRejectedValue({
      statusCode: 400,
      message: 'Sender and receiver must be different users'
    });

    const response = await request(app)
      .post('/api/messages')
      .send({
        senderId: 'usr_123',
        receiverId: 'usr_123',
        body: 'hello myself'
      })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toEqual({
      error: 'Sender and receiver must be different users'
    });
  });

  it('should return 201 for valid messages with different users', async () => {
    const mockMessage = {
      id: 1,
      sender_id: 'usr_123',
      receiver_id: 'usr_456',
      body: 'hello there',
      created_at: new Date().toISOString()
    };

    messageService.sendMessage.mockResolvedValue(mockMessage);

    const response = await request(app)
      .post('/api/messages')
      .send({
        senderId: 'usr_123',
        receiverId: 'usr_456',
        body: 'hello there'
      })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body).toEqual(mockMessage);
  });

  it('should propagate other errors to the error handler', async () => {
    const dbError = new Error('Database connection failed');
    messageService.sendMessage.mockRejectedValue(dbError);

    const response = await request(app)
      .post('/api/messages')
      .send({
        senderId: 'usr_123',
        receiverId: 'usr_456',
        body: 'test'
      })
      .expect(500);

    expect(response.body).toHaveProperty('error');
  });
});