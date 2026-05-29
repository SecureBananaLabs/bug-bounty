const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Request body is required');
  }
  
  const { email, name } = payload;
  
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new Error('A valid email is required');
  }
  
  if (name && (typeof name !== 'string' || name.length > 100)) {
    throw new Error('name must be a string of 100 characters or less');
  }
  
  const user = { id: `usr_${Date.now()}`, email, name: name || '', createdAt: new Date().toISOString() };
  users.push(user);
  return user;
}
