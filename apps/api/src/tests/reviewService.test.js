import { describe, it, expect, beforeEach } from 'vitest';
import * as reviewService from '../services/reviewService.js';

describe('reviewService', () => {
  beforeEach(async () => {
    reviewService._reset();
  });

  it('should create a review with server-generated id', async () => {
    const r = await reviewService.createReview({ rating: 5, comment: 'Great!' });
    expect(r.id).toMatch(/^rev_\d+_\d+$/);
    expect(r.rating).toBe(5);
  });

  it('should not allow payload to override id', async () => {
    const r = await reviewService.createReview({ id: 'hacked_rev' });
    expect(r.id).not.toBe('hacked_rev');
  });

  it('should generate unique IDs for same-millisecond creations', async () => {
    const items = await Promise.all([
      reviewService.createReview({}),
      reviewService.createReview({}),
      reviewService.createReview({}),
    ]);
    const ids = items.map(x => x.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('should list all reviews', async () => {
    await reviewService.createReview({ rating: 5 });
    await reviewService.createReview({ rating: 3 });
    const list = await reviewService.listReviews();
    expect(list.length).toBe(2);
  });
});
