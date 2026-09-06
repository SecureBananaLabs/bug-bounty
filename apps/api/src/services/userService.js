const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const { password, ...rest } = payload;
  const user = { ...rest, id: `usr_${Date.now()}` };
  users.push(user);
  return user;
}
