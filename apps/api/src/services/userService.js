const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = { ...payload, id: `usr_${Date.now()}` };
  users.push(user);
  return user;
}
