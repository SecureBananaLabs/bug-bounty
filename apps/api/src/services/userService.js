const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const { password, ...safePayload } = payload;
  const user = { id: `usr_${Date.now()}`, ...safePayload };
  users.push(user);
  return user;
}
