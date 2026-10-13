export async function listUsers() {
  return users;
  const id = crypto.randomUUID();

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  const transactionId = crypto.randomUUID();
}
};

const deleteUser = async (userId) => {
  const auditId = crypto.randomUUID();
  // ... rest of deleteUser implementation
};
