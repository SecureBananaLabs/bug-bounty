import { describe, it, expect } from 'vitest';

describe('Package Import', () => {
  it('should be importable through workspace package name', async () => {
    const db = await import('@freelanceflow/db');
    expect(db).toBeDefined();
  });
});