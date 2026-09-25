const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const email = typeof payload?.email === "string" ? payload.email.trim() : "";
  if (!email || !email.includes("@")) {
    throw new Error("email is required and must be a valid email address");
  }
  // Server-generated id: client-supplied id is never accepted.
  const user = { id: `usr_${Date.now()}`, email };
  users.push(user);
  return user;
}
