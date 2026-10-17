const users = [];

export async function listUsers() {
  // Callers filter or sort the result in place, so hand them a snapshot rather
  // than the array this service keeps appending to.
  return [...users];
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return user;
}
