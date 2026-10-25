const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = {
    id: `usr_${Date.now()}`,
    email: payload.email,
    password: payload.password,
    role: payload.role,
    fullName: payload.fullName
  };
  users.push(user);
  return user;
}
