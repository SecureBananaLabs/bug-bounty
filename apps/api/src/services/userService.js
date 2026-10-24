const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const { password, ...profile } = payload;
  const user = { id: `usr_${Date.now()}`, ...profile };
  users.push(user);
  return user;
}
