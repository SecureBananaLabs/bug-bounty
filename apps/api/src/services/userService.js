const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const { email, name } = payload;
  const user = {
    id: `usr_${Date.now()}`,
    email,
    name,
    role: "client",
  };
  users.push(user);
  return user;
}
