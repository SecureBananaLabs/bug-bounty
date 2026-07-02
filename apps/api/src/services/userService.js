const users = [];

export async function listUsers() {
  return users.map(({ password, ...rest }) => rest);
}

export async function findUserByEmail(email) {
  return users.find(u => u.email === email) ?? null;
}

export async function createUser(payload) {
  const id = `usr_${Date.now()}`;
  const user = { id, ...payload };
  users.push(user);
  return user;
}
