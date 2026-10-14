const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const { password, ...userPayload } = payload;
  const user = { id: `usr_${Date.now()}`, ...userPayload };
  users.push(user);
  return user;
}
