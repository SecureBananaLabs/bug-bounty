import { describe, it, expect, beforeEach } from 'vitest';
import * as notificationService from '../services/notificationService.js';

describe('notificationService', () => {
  beforeEach(async () => {
    const notifications = await notificationService.listNotifications();
    notifications.length = 0;
  });

  it('should create a notification with server-generated id and read=false', async () => {
    const n = await notificationService.createNotification({ message: 'Hello' });
    expect(n.id).toMatch(/^ntf_\d+_\d+$/);
    expect(n.message).toBe('Hello');
    expect(n.read).toBe(false);
  });

  it('should not allow payload to override server-generated id', async () => {
    const n = await notificationService.createNotification({ id: 'hacked_ntf' });
    expect(n.id).not.toBe('hacked_ntf');
    expect(n.id).toMatch(/^ntf_\d+_\d+$/);
  });

  it('should not allow payload to override read state', async () => {
    const n = await notificationService.createNotification({ read: true });
    expect(n.read).toBe(false);
  });

  it('should generate unique IDs for same-millisecond creations', async () => {
    const items = await Promise.all([
      notificationService.createNotification({}),
      notificationService.createNotification({}),
      notificationService.createNotification({}),
    ]);
    const ids = items.map(x => x.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('should list all notifications', async () => {
    await notificationService.createNotification({ message: 'A' });
    await notificationService.createNotification({ message: 'B' });
    const list = await notificationService.listNotifications();
    expect(list.length).toBe(2);
  });
});
