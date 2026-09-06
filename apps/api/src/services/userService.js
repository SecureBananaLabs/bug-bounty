const users = [];

export async function listUsers() {
  return users.map(({ password, ...user }) => user);
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return user;
}
