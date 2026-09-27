const users = [];

function toPublicUser(user) {
  const { password, passwordHash, accessToken, refreshToken, ...publicUser } = user;
  return publicUser;
}

export async function listUsers() {
  return users.map(toPublicUser);
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return user;
}
