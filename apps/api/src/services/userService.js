const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const fullName = typeof payload?.fullName === "string" ? payload.fullName.trim() : "";
  if (!fullName) {
    throw new Error("fullName is required");
  }

  const email = typeof payload?.email === "string" ? payload.email : "";
  const role = typeof payload?.role === "string" ? payload.role : "client";
  const user = { id: `usr_${Date.now()}`, fullName, email, role };
  users.push(user);
  return user;
}
