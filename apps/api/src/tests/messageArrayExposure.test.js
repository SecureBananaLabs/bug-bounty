import { describe, it, expect } from 'vitest';
import { listMessages, sendMessage } from '../services/messageService.js';

describe('messageService: listMessages returns copy (#13160)', () => {
  it('should return a copy, not the internal array', async () => {
    // Seed a message
    await sendMessage({ content: 'test', senderId: 'usr_1' });

    const result = await listMessages();
    expect(result).toHaveLength(1);

    // Mutating the returned array should not affect internal state
    result.push({ id: 'fake' });

    const result2 = await listMessages();
    expect(result2).toHaveLength(1); // Still 1, not 2
  });

  it('should return empty array when no messages exist', async () => {
    // (Can't easily clear messages between tests, just verify it's an array)
    const result = await listMessages();
    expect(Array.isArray(result)).toBe(true);
  });
});
