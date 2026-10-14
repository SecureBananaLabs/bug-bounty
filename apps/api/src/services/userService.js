const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const { email, name, role } = payload;
  const user = { id: `usr_${Date.now()}`, email, name, role };
  users.push(user);
  return user;
}
