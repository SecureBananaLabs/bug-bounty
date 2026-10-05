import { randomUUID } from 'node:crypto';

const users = new Map();

/**
 * List all registered users
 */
export async function listUsers() {
  return Array.from(users.values());
}

/**
 * Get a user by unique identifier
 */
export async function getUserById(id) {
  return users.get(id) || null;
}

/**
 * Get a user by email address
 */
export async function getUserByEmail(email) {
  if (!email) return null;
  for (const user of users.values()) {
    if (user.email && user.email.toLowerCase() === email.toLowerCase()) {
      return user;
    }
  }
  return null;
}

/**
 * Create a new user with cryptographically secure UUID
 */
export async function createUser(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid user payload');
  }

  const id = `usr_${randomUUID()}`;
  const now = new Date().toISOString();

  const user = {
    id,
    ...payload,
    createdAt: now,
    updatedAt: now,
  };

  users.set(id, user);
  return user;
}

/**
 * Update an existing user
 */
export async function updateUser(id, updates) {
  const existing = users.get(id);
  if (!existing) {
    return null;
  }

  const updated = {
    ...existing,
    ...updates,
    id: existing.id, // Prevent overriding immutable ID
    updatedAt: new Date().toISOString(),
  };

  users.set(id, updated);
  return updated;
}

/**
 * Delete a user by ID
 */
export async function deleteUser(id) {
  return users.delete(id);
}

/**
 * Helper to reset in-memory store during unit tests
 */
export function _clearUsers() {
  users.clear();
}
