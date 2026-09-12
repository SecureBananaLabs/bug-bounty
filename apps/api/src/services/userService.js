const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = {
    id: `usr_${Date.now()}`,
    email: payload.email,
    fullName: payload.fullName,
    role: payload.role ?? "client"
  };
  users.push(user);
  return user;
}
