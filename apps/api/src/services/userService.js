const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const { fullName, email, role } = payload;
  const user = {
    id: `usr_${Date.now()}`,
    fullName,
    email,
    role
  };
  users.push(user);
  return user;
}
