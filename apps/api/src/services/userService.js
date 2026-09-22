const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload, actor) {
  const { id, createdBy, ...userFields } = payload;
  const user = {
    ...userFields,
    id: `usr_${Date.now()}`,
    createdBy: actor.sub
  };
  users.push(user);
  return user;
}
