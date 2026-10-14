const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const { fullName, email, role, id, ...rest } = payload;
  if (!fullName || !String(fullName).trim()) {
    throw new Error("Full name required");
  }

  const user = {
    ...rest,
    fullName,
    email,
    role,
    id: `usr_${Date.now()}`,
  };
  users.push(user);
  return user;
}
