const users = [];

export async function listUsers() {
  // Callers sort or splice what they receive, so the shared array has to be
  // handed over as an independent snapshot.
  return [...users];
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return user;
}
