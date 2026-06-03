const request = require('supertest');
const app = require('../app');
const path = require('path');

// Mock the uploads directory creation if needed
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn()
}));

describe('POST /api/uploads', () => {
  it('should return 400 when no file is provided', async () => {
    const response = await request(app)
      .post('/api/uploads')
      .send();

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('No file provided');
  });

  it('should return 400 when file field is missing (empty body)', async () => {
    const response = await request(app)
      .post('/api/uploads')
      .field('someOtherField', 'value');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('No file provided');
  });

  it('should return 201 when a valid file is uploaded', async () => {
    const response = await request(app)
      .post('/api/uploads')
      .attach('file', Buffer.from('test file content'), 'test.txt');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('filename');
    expect(response.body).toHaveProperty('originalname', 'test.txt');
  });

  it('should return 400 when file field is present but empty', async () => {
    const response = await request(app)
      .post('/api/uploads')
      .field('file', '');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  });
});
