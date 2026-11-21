const users = [];
export async function listUsers() { return users; }
export async function createUser(payload) {
  const { id: _id, ...safe } = payload;
  const user = { id: `usr_${Date.now()}`, ...safe };
  users.push(user);
  return user;
}
