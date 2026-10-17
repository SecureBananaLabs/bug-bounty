const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  // The spread used to run after the generated id, so a caller-supplied `id`
  // replaced the server-generated identifier.
  const attributes = { ...payload };
  delete attributes.id;
  const user = { ...attributes, id: `usr_${Date.now()}` };
  users.push(user);
  return user;
}
