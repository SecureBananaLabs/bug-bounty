const users = [];

export class DuplicateUserEmailError extends Error {
  constructor(email) {
    super(`User with email ${email} already exists`);
    this.name = "DuplicateUserEmailError";
  }
}

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const email = payload?.email;
  const existingUser = email != null
    ? users.find((user) => user.email === email)
    : null;

  if (existingUser) {
    throw new DuplicateUserEmailError(email);
  }

  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return user;
}
