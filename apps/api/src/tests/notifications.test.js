const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const notificationRoutes = require('../routes/notificationRoutes');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/notifications', notificationRoutes);
  return app;
}

function authHeader(userId) {
  const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' });
  return { Authorization: `Bearer ${token}` };
}

describe('Notifications API', () => {
  let userId;
  let otherUserId;

  beforeAll(async () => {
    const user = await prisma.user.create({ data: { email: `user-${Date.now()}@test.com`, name: 'Test User', passwordHash: 'hash' } });
    userId = user.id;
    const other = await prisma.user.create({ data: { email: `other-${Date.now()}@test.com`, name: 'Other User', passwordHash: 'hash' } });
    otherUserId = other.id;
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.notification.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
  });

  test('GET /api/notifications returns empty list initially', async () => {
    const app = createApp();
    const res = await request(app).get('/api/notifications').set(authHeader(userId));
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
  });

  test('POST not allowed on /api/notifications', async () => {
    const app = createApp();
    const res = await request(app).post('/api/notifications').set(authHeader(userId)).send({});
    expect(res.status).toBe(404);
  });

  test('PATCH /api/notifications/:id/read marks notification as read', async () => {
    const app = createApp();
    const notif = await prisma.notification.create({ data: { userId, type: 'test', title: 'Test', message: 'Msg' } });
    const res = await request(app).patch(`/api/notifications/${notif.id}/read`).set(authHeader(userId));
    expect(res.status).toBe(200);
    expect(res.body.data.read).toBe(true);
  });

  test('PATCH /api/notifications/:id/read returns 404 for non-existent', async () => {
    const app = createApp();
    const res = await request(app).patch('/api/notifications/non-existent/read').set(authHeader(userId));
    expect(res.status).toBe(404);
  });

  test('PATCH /api/notifications/:id/read returns 404 for other user notification', async () => {
    const app = createApp();
    const notif = await prisma.notification.create({ data: { userId: otherUserId, type: 'test', title: 'Test', message: 'Msg' } });
    const res = await request(app).patch(`/api/notifications/${notif.id}/read`).set(authHeader(userId));
    expect(res.status).toBe(404);
  });

  test('PATCH /api/notifications/read-all marks all unread as read', async () => {
    const app = createApp();
    await prisma.notification.createMany({ data: [
      { userId, type: 'test', title: 'Test 1', message: 'Msg 1', read: false },
      { userId, type: 'test', title: 'Test 2', message: 'Msg 2', read: false },
      { userId, type: 'test', title: 'Test 3', message: 'Msg 3', read: true },
    ]});
    const res = await request(app).patch('/api/notifications/read-all').set(authHeader(userId));
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(2);
    const unread = await prisma.notification.count({ where: { userId, read: false } });
    expect(unread).toBe(0);
  });

  test('PATCH /api/notifications/read-all returns 0 when no unread', async () => {
    const app = createApp();
    await prisma.notification.createMany({ data: [
      { userId, type: 'test', title: 'Test 1', message: 'Msg 1', read: true },
      { userId, type: 'test', title: 'Test 2', message: 'Msg 2', read: true },
    ]});
    const res = await request(app).patch('/api/notifications/read-all').set(authHeader(userId));
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(0);
  });
});