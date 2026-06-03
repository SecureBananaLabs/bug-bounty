const users = [];

function createUser(payload) {
  const id = `usr_${Date.now()}`;
  const user = { id, ...payload };
  // Ensure server-owned fields cannot be overridden by caller payload
  user.id = id;
  users.push(user);
  return user;
}

function getUserById(id) {
  return users.find(user => user.id === id) || null;
}

function getAllUsers() {
  return [...users];
}

function deleteUser(id) {
  const index = users.findIndex(user => user.id === id);
  if (index === -1) return false;
  users.splice(index, 1);
  return true;
}

module.exports = { createUser, getUserById, getAllUsers, deleteUser };
