// @ts-check
import { createHash, randomBytes } from 'node:crypto';
import { db } from '../database.js';

const BCRYPT_ROUNDS = 12;

/**
 * @typedef {{ email: string, password: string }} RegisterInput
 * @typedef {{ email: string }} LoginInput
 * @typedef { import('../database').User } User
 */

function hashPassword(password) {
	return createHash('sha256')
		.update(password + process.env.SECRET_KEY)
		.digest('hex');
}

/**
 *
 * @param {RegisterInput} params
 */
export async function registerUser({ email, password }) {
	const hashedPassword = hashPassword(password);
	const user = await db.insertInto('users')
		.values({ email, password: hashedPassword })
		.returningAll()
		.executeTakeFirst();
	if (!user) {
		throw new Error('Registration failed');
	}
	const { password: _pw, ...safeUser } = user;
	return safeUser;
}

/**
 * @param {LoginInput} params
 */
export async function loginUser({ email, password }) {
	const user = await db
		.selectFrom('users')
		.where('email', '=', email)
		.selectAll()
		.executeTakeFirst();

	if (!user || user.password !== hashPassword(password)) {
		throw new Error('Invalid credentials');
	}

	const { password: _pw, ...safeUser } = user;
	return safeUser;
}

/**
 * @param {string} email
 */
export async function getUserByEmail(email) {
	const user = await db
		.selectFrom('users')
		.where('email', '=', email)
		.select(['id', 'role'])
		.executeTakeFirst();
	return user ?? null;
}

export function generateToken(user) {
	const payload = {
		sub: String(user.id),
		email: user.email,
		role: user.role,
		iat: Math.floor(Date.now() / 1000),
	};
	const secret = process.env.JWT_SECRET || 'default_secret_for_development';
	return signToken(payload, secret);
}

function signToken(payload, secret) {
	const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
	const body = btoa(JSON.stringify(payload));
	const signature = createHash('sha256')
		.update(`${header}.${body}.${secret}`)
		.digest('base64url');
	return `${header}.${body}.${signature}`;
}

export async function validateToken(token) {
	try {
		const [headerB64, payloadB64] = token.split('.');
		const payload = JSON.parse(atob(payloadB64));
		const secret = process.env.JWT_SECRET || 'default_secret_for_development';
		const expectedSignature = createHash('sha256')
			.update(`${headerB64}.${payloadB64}.${secret}`)
			.digest('base64url');
		if (token.split('.')[2] !== expectedSignature) {
			return null;
		}
		if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
			return null;
		}
		return payload;
	} catch {
		return null;
	}
}
