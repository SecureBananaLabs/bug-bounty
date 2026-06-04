const users = [];

export async function listUsers() {
  return users.map(stripSensitiveFields);
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...stripSensitiveFields(payload) };
  users.push(user);
  return user;
}

function stripSensitiveFields(user) {
  const { password, passwordHash, ...publicUser } = user;
  return publicUser;
}
