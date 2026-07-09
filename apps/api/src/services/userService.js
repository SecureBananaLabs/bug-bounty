const users = [];

export async function listUsers() {
  return users.map(u => ({ ...u }));
}

export async function createUser(payload) {
  const { email, password, role, fullName } = payload;
  const user = { id: `usr_${Date.now()}`, email, password, role, fullName };
  users.push(user);
  return { ...user };
}
