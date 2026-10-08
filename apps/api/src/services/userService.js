const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  // The generated identifier is server-owned: spreading the payload afterwards
  // would let a request body squat on an id another service already resolved.
  const user = { ...payload, id: `usr_${Date.now()}` };
  users.push(user);
  return user;
}
