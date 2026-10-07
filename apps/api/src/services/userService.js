const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  // The generated identifier is authoritative, so it has to be assigned after
  // the payload is spread instead of being overwritten by a client-supplied id.
  const user = { ...payload, id: `usr_${Date.now()}` };
  users.push(user);
  return user;
}
