const users = [];

export async function listUsers() {
  // Return a shallow copy — callers cannot mutate the in-memory store.
  return [...users];
}

export async function createUser(payload) {
  // Server-controlled id must come AFTER the spread so the client
  // cannot supply their own user ID via the request body.
  const user = {
    ...payload,
    id: `usr_${Date.now()}`
  };
  users.push(user);
  return user;
}
