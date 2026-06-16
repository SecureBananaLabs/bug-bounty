const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const { email, password, role } = payload;
  const user = { id: `usr_${Date.now()}`, email, password, role };
  users.push(user);
  return user;
}
