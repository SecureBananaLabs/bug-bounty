const users = [];

export async function listUsers() {
  return users.map(({ password, token, ...safeUser }) => safeUser);
}

export async function createUser(payload) {
  const user = { ...payload, id: `usr_${Date.now()}` };
  users.push(user);
  const { password, token, ...safeUser } = user;
  return safeUser;
}
