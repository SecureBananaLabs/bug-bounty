const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const { id, ...userPayload } = payload;
  const user = { ...userPayload, id: `usr_${Date.now()}` };
  users.push(user);
  return user;
}
