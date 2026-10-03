import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { app } from '../app';
import { prisma } from '../config/db';
import { createReviewSchema } from '../validators/review';
import { authenticateTestUser } from './utils/authHelper';

describe('Review Validation', () => {
  let server;
  let authenticatedUser;
  let targetUser;

  beforeAll(async () => {
    server = createServer(app);
    await server.listen();
    
    // Create test users
    authenticatedUser = await prisma.user.create({
      data: {
        username: 'reviewer',
        email: 'reviewer@example.com',
        password: 'hashedpassword',
      },
    });
    
    targetUser = await prisma.user.create({
      data: {
        username: 'reviewee',
        email: 'reviewee@example.com',
        password: 'hashedpassword',
      },
    });
  });

  afterAll(async () => {
    await server.close();
    await prisma.user.deleteMany({
      where: {
        username: {
          in: ['reviewer', 'reviewee'],
        },
      },
    });
  });

  describe('createReviewSchema validation', () => {
    it('should accept valid review data', () => {
      const validReview = {
        targetUserId: targetUser.id,
        rating: 4,
        comment: 'Great work! Highly recommend.',
      };
      
      const result = createReviewSchema.safeParse(validReview);
      expect(result.success).toBe(true);
    });

    it('should reject review without targetUserId', () => {
      const invalidReview = {
        rating: 4,
        comment: 'Great work! Highly recommend.',
      };
      
      const result = createReviewSchema.safeParse(invalidReview);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Target user ID is required');
      }
    });

    it('should reject review with rating below 1', () => {
      const invalidReview = {
        targetUserId: targetUser.id,
        rating: 0,
        comment: 'Great work! Highly recommend.',
      };
      
      const result = createReviewSchema.safeParse(invalidReview);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Rating must be at least 1');
      }
    });

    it('should reject review with rating above 5', () => {
      const invalidReview = {
        targetUserId: targetUser.id,
        rating: 6,
        comment: 'Great work! Highly recommend.',
      };
      
      const result = createReviewSchema.safeParse(invalidReview);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Rating must be at most 5');
      }
    });

    it('should reject review with comment shorter than 10 characters', () => {
      const invalidReview = {
        targetUserId: targetUser.id,
        rating: 4,
        comment: 'Short',
      };
      
      const result = createReviewSchema.safeParse(invalidReview);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Comment must be at least 10 characters long');
      }
    });
  });
});