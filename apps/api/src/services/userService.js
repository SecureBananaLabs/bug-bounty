const users = [];

const PERSISTED_FIELDS = ["email", "fullName", "bio", "role"];

function userRecord(payload) {
  const record = {};

  for (const field of PERSISTED_FIELDS) {
    if (payload[field] !== undefined) {
      record[field] = payload[field];
    }
  }

  return record;
}

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...userRecord(payload) };
  users.push(user);
  return user;
}

