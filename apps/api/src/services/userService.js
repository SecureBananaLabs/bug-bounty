const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const { id, isVerified, ...profile } = payload ?? {};
  const user = { ...profile, id: `usr_${Date.now()}`, isVerified: false };
  users.push(user);
  return user;
}
