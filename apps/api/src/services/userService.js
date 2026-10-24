const users = [];

export async function listUsers() {
  return users;
}

export async function createUser({ email, fullName, bio, role } = {}) {
  const user = {
    id: `usr_${Date.now()}`,
    email,
    fullName,
    ...(bio === undefined ? {} : { bio }),
    ...(role === undefined ? {} : { role }),
  };

  users.push(user);
  return user;
}
