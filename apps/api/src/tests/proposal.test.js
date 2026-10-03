import request from 'supertest';
import { app } from '../app.js';
import { createProposalSchema } from '../validators/proposal.js';

describe('Proposal Validation', () => {
  describe('createProposalSchema', () => {
    it('should reject missing jobId', () => {
      const invalidData = {
        coverLetter: 'I am interested in this job.',
        bidAmount: 100,
      };
      const result = createProposalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toBe('Job ID is required');
    });

    it('should reject empty jobId', () => {
      const invalidData = {
        jobId: '',
        coverLetter: 'I am interested in this job.',
        bidAmount: 100,
      };
      const result = createProposalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toBe('Job ID is required');
    });

    it('should reject short coverLetter', () => {
      const invalidData = {
        jobId: 'job123',
        coverLetter: 'Short',
        bidAmount: 100,
      };
      const result = createProposalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toBe('Cover letter must be at least 10 characters');
    });

    it('should reject zero bidAmount', () => {
      const invalidData = {
        jobId: 'job123',
        coverLetter: 'I am interested in this job and have the required skills.',
        bidAmount: 0,
      };
      const result = createProposalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toBe('Bid amount must be a positive number');
    });

    it('should reject negative bidAmount', () => {
      const invalidData = {
        jobId: 'job123',
        coverLetter: 'I am interested in this job and have the required skills.',
        bidAmount: -50,
      };
      const result = createProposalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toBe('Bid amount must be a positive number');
    });

    it('should reject infinite bidAmount', () => {
      const invalidData = {
        jobId: 'job123',
        coverLetter: 'I am interested in this job and have the required skills.',
        bidAmount: Infinity,
      };
      const result = createProposalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toBe('Bid amount must be a finite number');
    });

    it('should accept valid proposal data', () => {
      const validData = {
        jobId: 'job123',
        coverLetter: 'I am interested in this job and have the required skills with relevant experience.',
        bidAmount: 100,
      };
      const result = createProposalSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('POST /api/proposals', () => {
    it('should reject invalid proposal with negative bid', async () => {
      const invalidProposal = {
        jobId: 'job123',
        coverLetter: 'I am interested in this job.',
        bidAmount: -50,
      };
      
      const response = await request(app)
        .post('/api/proposals')
        .send(invalidProposal)
        .expect(400);
      
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(error => error.message === 'Bid amount must be a positive number')).toBe(true);
    });

    it('should reject invalid proposal with zero bid', async () => {
      const invalidProposal = {
        jobId: 'job123',
        coverLetter: 'I am interested in this job.',
        bidAmount: 0,
      };
      
      const response = await request(app)
        .post('/api/proposals')
        .send(invalidProposal)
        .expect(400);
      
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(error => error.message === 'Bid amount must be a positive number')).toBe(true);
    });

    it('should accept valid proposal', async () => {
      const validProposal = {
        jobId: 'job123',
        coverLetter: 'I am interested in this job and have the required skills with relevant experience.',
        bidAmount: 100,
      };
      
      const response = await request(app)
        .post('/api/proposals')
        .send(validProposal)
        .expect(201);
      
      expect(response.body.message).toBe('Proposal created successfully');
      expect(response.body.data).toBeDefined();
    });
  });
});