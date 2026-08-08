import { test } from 'node:test';
import request from 'supertest';
import { createApp } from '../app.js';

test('rejects upload without file', async () => {
  const app = createApp();
  const response = await request(app).post('/api/uploads').send();
  if (response.status !== 400) throw new Error(`expected 400 got ${response.status}`);
});