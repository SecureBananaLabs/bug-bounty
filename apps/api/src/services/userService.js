const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  // Strip any client-supplied id; server owns identity generation
  const { email, role } = payload;
  const user = { id: `usr_${Date.now()}`, email, role };
  users.push(user);
  return user;
}
