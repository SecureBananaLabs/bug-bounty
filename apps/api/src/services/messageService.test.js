const { sendMessage } = require('./messageService');

describe('sendMessage', () => {
  it('should return a message with a server-generated id starting with msg_', () => {
    const result = sendMessage({ content: 'Hello' });
    expect(result.id).toMatch(/^msg_/);
  });

  it('should ignore a caller-supplied id and use server-generated id', () => {
    const result = sendMessage({ id: 'spoofed-id-123', content: 'Hello' });
    expect(result.id).toMatch(/^msg_/);
    expect(result.id).not.toBe('spoofed-id-123');
  });

  it('should preserve other payload fields', () => {
    const result = sendMessage({ content: 'Hello', userId: 'user-1', roomId: 'room-1' });
    expect(result.content).toBe('Hello');
    expect(result.userId).toBe('user-1');
    expect(result.roomId).toBe('room-1');
  });

  it('should set sentAt to a valid ISO string', () => {
    const result = sendMessage({ content: 'Hello' });
    expect(result.sentAt).toBeDefined();
    expect(() => new Date(result.sentAt)).not.toThrow();
    expect(new Date(result.sentAt).toISOString()).toBe(result.sentAt);
  });

  it('should generate unique ids for consecutive calls', () => {
    const result1 = sendMessage({ content: 'First' });
    const result2 = sendMessage({ content: 'Second' });
    expect(result1.id).not.toBe(result2.id);
  });
});
