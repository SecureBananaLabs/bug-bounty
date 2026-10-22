import { describe, it, expect } from 'vitest';
import { registerUser } from '../services/authService.js';

describe('authService: registration token consistency (#12741)', () => {
  it('should use same user id in response and JWT subject', async () => {
    const result = await registerUser({
      email: 'test@example.com',
      role: 'client',
      password: 'Password123!',
    });

    expect(result.id).toMatch(/^usr_\d+$/);
    expect(typeof result.token).toBe('string');

    const payload = JSON.parse(atob(result.token.split('.')[1]));
    expect(payload.sub).toBe(result.id);
  });

  it('should generate unique ids for different registrations', async () => {
    const [r1, r2] = await Promise.all([
      registerUser({ email: 'a@b.com', role: 'client', password: 'Pass123!' }),
      registerUser({ email: 'c@d.com', role: 'freelancer', password: 'Pass123!' }),
    ]);

    expect(r1.id).not.toBe(r2.id);

    const p1 = JSON.parse(atob(r1.token.split('.')[1]));
    const p2 = JSON.parse(atob(r2.token.split('.')[1]));
    expect(p1.sub).toBe(r1.id);
    expect(p2.sub).toBe(r2.id);
  });
});
