const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const { id: _ignored, ...safe } = payload;
  const user = { ...safe, id: `usr_${Date.now()}` };
  users.push(user);
  return user;
}
