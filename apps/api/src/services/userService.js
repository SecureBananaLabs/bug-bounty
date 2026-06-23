const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  const { password, passwordHash, ...safeUser } = user;
  return safeUser;
}
