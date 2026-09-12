import { describe, it, expect, beforeEach } from 'vitest';
import * as messageService from '../services/messageService.js';

describe('messageService', () => {
  beforeEach(async () => {
    messageService._reset();
  });

  it('should create a message with server-generated id and timestamp', async () => {
    const m = await messageService.sendMessage({ content: 'Hello!' });
    expect(m.id).toMatch(/^msg_\d+_\d+$/);
    expect(m.content).toBe('Hello!');
    expect(m.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('should not allow payload to override id', async () => {
    const m = await messageService.sendMessage({ id: 'hacked_msg' });
    expect(m.id).not.toBe('hacked_msg');
  });

  it('should not allow payload to override sentAt', async () => {
    const m = await messageService.sendMessage({ sentAt: '2020-01-01' });
    // sentAt is set after spread, so server value wins
    expect(m.sentAt).not.toBe('2020-01-01');
  });

  it('should generate unique IDs for same-millisecond creations', async () => {
    const items = await Promise.all([
      messageService.sendMessage({}),
      messageService.sendMessage({}),
      messageService.sendMessage({}),
    ]);
    const ids = items.map(x => x.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('should list all messages', async () => {
    await messageService.sendMessage({ content: 'A' });
    await messageService.sendMessage({ content: 'B' });
    const list = await messageService.listMessages();
    expect(list.length).toBe(2);
  });
});
