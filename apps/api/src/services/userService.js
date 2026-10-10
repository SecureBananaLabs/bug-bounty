// In-memory user store.
//
// Security note (#6334): user records must never contain submitted password
// material. This service strips secret fields defensively on create and on
// update so nothing sensitive can be persisted or returned by the user API.

const users = [];
let nextUserId = 1;

// Fields that must never be persisted on a user record, even if submitted.
const SECRET_FIELDS = [
  'password',
  'passwordHash',
  'passwordConfirmation',
  'confirmPassword',
];

/**
 * Returns a shallow copy of `data` with all secret fields removed.
 * Non-secret profile fields are preserved untouched.
 */
function stripSecrets(data) {
  const safe = { ...(data || {}) };
  for (const field of SECRET_FIELDS) {
    delete safe[field];
  }
  return safe;
}

const createUser = (userData) => {
  const user = {
    id: nextUserId++,
    ...stripSecrets(userData),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
};

const getAllUsers = () => users;

const getUserById = (id) => users.find((user) => user.id === id) || null;

const getUserByEmail = (email) =>
  users.find((user) => user.email === email) || null;

const updateUser = (id, updates) => {
  const user = getUserById(id);
  if (!user) return null;
  Object.assign(user, stripSecrets(updates));
  return user;
};

const deleteUser = (id) => {
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) return false;
  users.splice(index, 1);
  return true;
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
};
