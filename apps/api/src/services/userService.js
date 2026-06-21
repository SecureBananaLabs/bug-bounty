const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = {
    id: `usr_${Date.now()}`,
    createdAt: new Date().toISOString(),
    verified: false,
    ...payload,
  };
  users.push(user);
  return user;
}
