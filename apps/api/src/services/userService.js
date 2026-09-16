const users = [];

export async function listUsers() {
  return users;
}

export async function findUserByEmail(email) {
  return users.find((u) => u.email === email);
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return user;
}
