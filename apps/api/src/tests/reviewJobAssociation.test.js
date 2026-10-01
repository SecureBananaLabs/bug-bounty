import { describe, it, expect } from 'vitest';
import { createReview, listReviews, listReviewsByJob } from '../services/reviewService.js';

describe('reviewService: job association (#12749)', () => {
  it('should create review with jobId', async () => {
    const review = await createReview({
      rating: 5,
      comment: 'Great work',
      reviewerId: 'usr_1',
      revieweeId: 'usr_2',
      jobId: 'job_123',
    });

    expect(review.jobId).toBe('job_123');
    expect(review.id).toMatch(/^rev_\d+$/);
  });

  it('should filter reviews by jobId', async () => {
    await createReview({ rating: 5, comment: 'A', reviewerId: 'u1', revieweeId: 'u2', jobId: 'job_A' });
    await createReview({ rating: 3, comment: 'B', reviewerId: 'u1', revieweeId: 'u3', jobId: 'job_B' });
    await createReview({ rating: 4, comment: 'C', reviewerId: 'u2', revieweeId: 'u1', jobId: 'job_A' });

    const jobAReviews = await listReviewsByJob('job_A');
    expect(jobAReviews.length).toBe(2);

    const jobBReviews = await listReviewsByJob('job_B');
    expect(jobBReviews.length).toBe(1);
  });

  it('should return empty array for job with no reviews', async () => {
    const reviews = await listReviewsByJob('job_nonexistent');
    expect(reviews).toEqual([]);
  });
});
