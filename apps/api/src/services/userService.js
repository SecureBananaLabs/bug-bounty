const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  if (!payload || Object.keys(payload).length === 0) {
    throw new Error("Payload cannot be empty");
  }
  const user = { ...payload, id: `usr_${Date.now()}` };
  users.push(user);
  return user;
}
