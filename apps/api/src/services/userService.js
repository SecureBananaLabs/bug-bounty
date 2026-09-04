const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const { id, isVerified, ...userFields } = payload;
  const user = { ...userFields, id: `usr_${Date.now()}`, isVerified: false };
  users.push(user);
  return user;
}
