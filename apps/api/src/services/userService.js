const users = [];

export async function listUsers() {
  return [...users]; // Defensive copy
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return user;
}
