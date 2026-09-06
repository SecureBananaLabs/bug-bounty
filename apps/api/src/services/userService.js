const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const { id, ...rest } = payload;
  const user = { id: `usr_${Date.now()}`, ...rest };
  users.push(user);
  return user;
}