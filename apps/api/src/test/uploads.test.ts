import request from 'supertest';
import { app } from '../app';

describe('POST /api/uploads', () => {
  it('should reject requests without a file with 400 status', async () => {
    const res = await request(app)
      .post('/api/uploads')
      .expect(400);
    
    expect(res.body.success).toBe(false);
    expect(res.body).toHaveProperty('error');
  });

  it('should successfully process requests with a file', async () => {
    // Mock file buffer for testing
    const fileBuffer = Buffer.from('test file content', 'utf-8');
    
    const res = await request(app)
      .post('/api/uploads')
      .attach('file', fileBuffer, 'test.txt')
      .expect(201);
    
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('filename');
  });

  it('should reject when file field is missing but other fields are present', async () => {
    const res = await request(app)
      .post('/api/uploads')
      .field('description', 'some description')
      .expect(400);
    
    expect(res.body.success).toBe(false);
  });
});