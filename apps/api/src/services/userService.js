const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  // Server always generates the ID — never trust client-supplied id
  const { email, name, role, bio } = payload;
  const user = {
    id: `usr_${Date.now()}`,
    email,
    name,
    role,
    ...(bio !== undefined && { bio })
  };
  users.push(user);
  return user;
}
