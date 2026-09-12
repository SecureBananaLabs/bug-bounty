import request from 'supertest';
import app from '../../src/app.js';
import { authRoutes } from '../../src/routes/authRoutes.js';
import { uploadRoutes } from '../../src/routes/uploadRoutes.js';
import { authMiddleware } from '../../src/middleware/auth.js';
import { registerUser, loginUser } from '../../src/controllers/authController.js';
import { uploadFile } from '../../src/controllers/uploadController.js';

describe('Upload Routes', () => {
  beforeEach(() => {
    app.use('/api/auth', authRoutes);
    app.use('/api/uploads', uploadRoutes);
  });

  it('should require authentication for upload', async () => {
    const res = await request(app).post('/api/uploads').field('file', 'test.txt');
    expect(res.status).toBe(401);
  });

  it('should allow authenticated upload', async () => {
    // 先注册用户
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password' });

    // 获取登录凭证
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    // 使用有效token进行上传
    const res = await request(app)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .field('file', 'test.txt');
    
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('uploaded');
  });
});