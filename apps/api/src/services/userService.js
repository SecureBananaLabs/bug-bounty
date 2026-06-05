const users = [
  {
    id: "usr_existing",
    email: "user@example.com",
    password: "password123",
    role: "client"
  }
];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return user;
}
