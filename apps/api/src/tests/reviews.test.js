const request = require('supertest');
const app = require('../app');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

function authToken(user) {
  return jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
}

describe('Review API', () => {
  let client, freelancer, job, clientToken, freelancerToken;

  beforeAll(async () => {
    client = await prisma.user.create({ data: { email: 'client_rev@test.com', name: 'Client Rev', passwordHash: 'hash', role: 'CLIENT' } });
    freelancer = await prisma.user.create({ data: { email: 'freelancer_rev@test.com', name: 'Freelancer Rev', passwordHash: 'hash', role: 'FREELANCER' } });
    job = await prisma.job.create({ data: { title: 'Test Job', description: 'Desc', clientId: client.id, status: 'COMPLETED' } });
    clientToken = authToken(client);
    freelancerToken = authToken(freelancer);
  });

  afterAll(async () => {
    await prisma.review.deleteMany({ where: { jobId: job.id } });
    await prisma.job.delete({ where: { id: job.id } });
    await prisma.user.deleteMany({ where: { id: { in: [client.id, freelancer.id] } } });
    await prisma.$disconnect();
  });

  test('POST /api/reviews - client creates review for freelancer', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ jobId: job.id, freelancerId: freelancer.id, rating: 5, comment: 'Great work!' });
    expect(res.status).toBe(201);
    expect(res.body.rating).toBe(5);
  });

  test('GET /api/reviews/freelancer/:id - get reviews for freelancer', async () => {
    const res = await request(app)
      .get(`/api/reviews/freelancer/${freelancer.id}`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/reviews/freelancer/:id/rating - get aggregate rating for freelancer', async () => {
    const res = await request(app)
      .get(`/api/reviews/freelancer/${freelancer.id}/rating`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('averageRating');
    expect(res.body).toHaveProperty('totalReviews');
    expect(typeof res.body.averageRating).toBe('number');
    expect(typeof res.body.totalReviews).toBe('number');
    expect(res.body.totalReviews).toBeGreaterThanOrEqual(1);
    expect(res.body.averageRating).toBeGreaterThan(0);
  });
});

// Unit tests for reviewService.getFreelancerRating
describe('reviewService.getFreelancerRating', () => {
  const { getFreelancerRating } = require('../services/reviewService');
  let testFreelancer, testClient, testJob;

  beforeAll(async () => {
    testFreelancer = await prisma.user.create({ data: { email: 'freelancer_rating@test.com', name: 'Freelancer Rating', passwordHash: 'hash', role: 'FREELANCER' } });
    testClient = await prisma.user.create({ data: { email: 'client_rating@test.com', name: 'Client Rating', passwordHash: 'hash', role: 'CLIENT' } });
    testJob = await prisma.job.create({ data: { title: 'Rating Job', description: 'Desc', clientId: testClient.id, status: 'COMPLETED' } });
  });

  afterAll(async () => {
    await prisma.review.deleteMany({ where: { freelancerId: testFreelancer.id } });
    await prisma.job.delete({ where: { id: testJob.id } });
    await prisma.user.deleteMany({ where: { id: { in: [testFreelancer.id, testClient.id] } } });
  });

  test('returns 0.0 average and 0 total when no reviews exist', async () => {
    const newFreelancer = await prisma.user.create({ data: { email: 'no_reviews@test.com', name: 'No Reviews', passwordHash: 'hash', role: 'FREELANCER' } });
    const result = await getFreelancerRating(newFreelancer.id);
    expect(result.averageRating).toBe(0.0);
    expect(result.totalReviews).toBe(0);
    await prisma.user.delete({ where: { id: newFreelancer.id } });
  });

  test('computes average rating rounded to 1 decimal place', async () => {
    await prisma.review.createMany({ data: [
      { jobId: testJob.id, freelancerId: testFreelancer.id, reviewerId: testClient.id, rating: 5, comment: 'Excellent' },
      { jobId: testJob.id, freelancerId: testFreelancer.id, reviewerId: testClient.id, rating: 4, comment: 'Good' },
    ] });

    const result = await getFreelancerRating(testFreelancer.id);
    expect(result.totalReviews).toBe(2);
    expect(result.averageRating).toBe(4.5);
  });

  test('rounds average correctly (e.g., 4.33 -> 4.3, 4.35 -> 4.4)', async () => {
    const freelancer = await prisma.user.create({ data: { email: 'round_test@test.com', name: 'Round Test', passwordHash: 'hash', role: 'FREELANCER' } });
    const client = await prisma.user.create({ data: { email: 'round_client@test.com', name: 'Round Client', passwordHash: 'hash', role: 'CLIENT' } });
    const job = await prisma.job.create({ data: { title: 'Round Job', description: 'Desc', clientId: client.id, status: 'COMPLETED' } });

    await prisma.review.createMany({ data: [
      { jobId: job.id, freelancerId: freelancer.id, reviewerId: client.id, rating: 4, comment: 'Good' },
      { jobId: job.id, freelancerId: freelancer.id, reviewerId: client.id, rating: 4, comment: 'Good' },
      { jobId: job.id, freelancerId: freelancer.id, reviewerId: client.id, rating: 5, comment: 'Great' },
    ] });

    const result = await getFreelancerRating(freelancer.id);
    expect(result.totalReviews).toBe(3);
    expect(result.averageRating).toBe(4.3);

    await prisma.review.deleteMany({ where: { freelancerId: freelancer.id } });
    await prisma.job.delete({ where: { id: job.id } });
    await prisma.user.deleteMany({ where: { id: { in: [freelancer.id, client.id] } } });
  });
});