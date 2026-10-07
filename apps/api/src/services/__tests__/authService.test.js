// @ts-check
import { describe, it, expect, beforeEach } from 'vitest';
import { registerUser, loginUser, generateToken, validateToken } from '../authService.js';
import { db } from '../../database.js';

describe('authService unit tests', () => {
	beforeEach(async () => {
		await db.deleteFrom('users').execute();
	});

	it('registerUser returns a user without password', async () => {
		const user = await registerUser({ email: 'a@b.com', password: 'secret123' });
		expect(user).toEqual(
			expect.objectContaining({
				email: 'a@b.com',
			}),
		);
		expect(user).toHaveProperty('id');
		expect(user).toHaveProperty('role');
		expect(user.password).toBeUndefined();
	});

	it('loginUser returns user with id, role, email, and token', async () => {
		const user = await registerUser({ email: 'login@test.com', password: 'testpass123' });
		const loginResult = await loginUser({ email: 'login@test.com', password: 'testpass123' });

		expect(loginResult).toEqual(
			expect.objectContaining({
				email: 'login@test.com',
				id: user.id,
				role: user.role,
			}),
		);
		expect(loginResult.password).toBeUndefined();
	});

	it('loginUser throws for invalid credentials', async () => {
		await registerUser({ email: 'wrong@test.com', password: 'correctpass' });
		await expect(
			loginUser({ email: 'wrong@test.com', password: 'wrongpass' }),
		).rejects.toThrow('Invalid credentials');
	});

	it('generateToken produces a JWT-like string', () => {
		const user = { id: 1, email: 'token@test.com', role: 'creator' };
		const token = generateToken(user);
		expect(typeof token).toBe('string');
		expect(token.split('.').length).toBe(3);
	});

	it('validateToken validates a correctly signed token', async () => {
		const user = { id: 2, email: 'valid@test.com', role: 'admin' };
		const token = generateToken(user);
		const payload = await validateToken(token);
		expect(payload).toEqual(
			expect.objectContaining({
				sub: '2',
				email: 'valid@test.com',
				role: 'admin',
			}),
		);
	});

	it('validateToken rejects tampered tokens', async () => {
		const user = { id: 3, email: 'tampered@test.com', role: 'moderator' };
		const token = generateToken(user);
		const tamperedToken = token.split('.').map((part, idx) =>
			idx === 1 ? btoa(JSON.stringify({ ...JSON.parse(atob(part)), role: 'hacked' })) : part,
		).join('.');
		const payload = await validateToken(tamperedToken);
		expect(payload).toBeNull();
	});
});
