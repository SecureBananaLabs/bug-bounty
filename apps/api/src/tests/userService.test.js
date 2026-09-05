import { describe, it, expect, beforeEach } from 'vitest';
import * as userService from '../services/userService.js';

describe('userService', () => {
  beforeEach(async () => {
    userService._reset();
  });

  it('should create a user with server-generated id', async () => {
    const user = await userService.createUser({ email: 'test@example.com' });
    expect(user.id).toMatch(/^usr_\d+_\d+$/);
    expect(user.email).toBe('test@example.com');
  });

  it('should not allow payload to override id', async () => {
    const user = await userService.createUser({ id: 'hacked_usr' });
    expect(user.id).not.toBe('hacked_usr');
  });

  it('should block credential fields from being stored', async () => {
    const user = await userService.createUser({
      email: 'test@example.com',
      password: 's3cret!',
      token: 'jwt_token_123',
      apiKey: 'sk_live_xxx',
    });
    expect(user.password).toBeUndefined();
    expect(user.token).toBeUndefined();
    expect(user.apiKey).toBeUndefined();
    expect(user.email).toBe('test@example.com'); // normal field preserved
  });

  it('should not expose credentials in listUsers', async () => {
    await userService.createUser({ email: 'a@b.com', password: 'hidden' });
    await userService.createUser({ email: 'c@d.com', resetToken: 'token_xyz' });
    const users = await userService.listUsers();
    expect(users.length).toBe(2);
    for (const u of users) {
      expect(u.password).toBeUndefined();
      expect(u.resetToken).toBeUndefined();
      expect(u.token).toBeUndefined();
    }
  });

  it('should generate unique IDs for same-millisecond creations', async () => {
    const items = await Promise.all([
      userService.createUser({}),
      userService.createUser({}),
      userService.createUser({}),
    ]);
    const ids = items.map(u => u.id);
    expect(new Set(ids).size).toBe(3);
  });
});
