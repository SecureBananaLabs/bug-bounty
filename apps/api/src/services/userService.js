const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Invalid payload');
  }

  const allowedKeys = ['name', 'email', 'role'];
  for (const key of Object.keys(payload)) {
    if (!allowedKeys.includes(key)) {
      throw new Error(`Unknown field: ${key}`);
    }
  }

  const { name, email, role } = payload;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error('Name is required');
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new Error('A valid email is required');
  }

  const allowedRoles = ['user'];
  const userRole = allowedRoles.includes(role) ? role : 'user';

  const user = {
    id: `usr_${Date.now()}`,
    name,
    email,
    role: userRole
  };

  users.push(user);
  return user;
}
