import { describe, it, expect } from 'vitest';

describe('@freelanceflow/db import', () => {
  it('should be importable from the workspace package name', async () => {
    const db = await import('@freelanceflow/db');
    expect(db).toBeDefined();
  });
});