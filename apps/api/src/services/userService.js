const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const userId = `usr_${Date.now()}`;
  const user = { id: userId, ...payload };
  users.push(user);
  return user;
}
