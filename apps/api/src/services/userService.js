const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const { email, fullName, role } = payload;
  const user = { id: `usr_${Date.now()}`, email, fullName, role };
  users.push(user);
  return user;
}
