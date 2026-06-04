const request = require('supertest');
const app = require('../../src/app');
const { MAX_SKILLS } = require('../../src/validators/jobValidator');

// Mock authentication middleware for testing
jest.mock('../../src/middleware/auth', () => (req, res, next) => {
  req.user = { id: 'mockUserId' };
  next();
});

describe('POST /api/jobs - Skills cap integration', () => {
  it('should create a job with valid skills array', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .send({
        title: 'Test Job',
        description: 'A test job',
        budget: 100,
        skills: ['JavaScript', 'Node.js'],
        category: 'Development',
      });
    expect(res.status).toBe(201);
    expect(res.body.skills).toEqual(['JavaScript', 'Node.js']);
  });

  it('should create a job with default empty skills when omitted', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .send({
        title: 'Test Job',
        description: 'A test job',
        budget: 100,
        category: 'Development',
      });
    expect(res.status).toBe(201);
    expect(res.body.skills).toEqual([]);
  });

  it('should reject job creation with too many skills', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .send({
        title: 'Test Job',
        description: 'A test job',
        budget: 100,
        skills: Array(MAX_SKILLS + 1).fill('Skill'),
        category: 'Development',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('must contain less than or equal to');
  });

  it('should reject job update with too many skills', async () => {
    // First create a job
    const createRes = await request(app)
      .post('/api/jobs')
      .send({
        title: 'Test Job',
        description: 'A test job',
        budget: 100,
        skills: ['JavaScript'],
        category: 'Development',
      });
    const jobId = createRes.body._id;

    // Try to update with too many skills
    const updateRes = await request(app)
      .put(`/api/jobs/${jobId}`)
      .send({ skills: Array(MAX_SKILLS + 1).fill('Skill') });
    expect(updateRes.status).toBe(400);
    expect(updateRes.body.error).toContain('must contain less than or equal to');
  });
});
