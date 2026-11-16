const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const { email, name, role, bio, skills, avatarUrl } = payload;
  const user = {
    id: `usr_${Date.now()}`,
    email,
    name,
    role,
    bio,
    skills,
    avatarUrl
  };
  users.push(user);
  return user;
}
