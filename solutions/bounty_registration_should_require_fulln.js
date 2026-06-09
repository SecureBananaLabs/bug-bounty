// Registration validation and service ensuring fullName is required
// Mock Prisma-like user storage
const users = [];

/**
 * Validates registration payload.
 * Throws if required fields missing or fullName empty.
 * @param {Object} data
 * @returns {Object} sanitized data
 */
function validateRegistration(data) {
  const { email, password, role, fullName } = data;
  if (!email || typeof email !== 'string' || !email.trim()) {
    throw new Error('Validation error: email is required');
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new Error('Validation error: password must be at least 6 characters');
  }
  if (!role || typeof role !== 'string' || !role.trim()) {
    throw new Error('Validation error: role is required');
  }
  if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
    throw new Error('Validation error: fullName is required and must not be empty');
  }
  return {
    email: email.trim(),
    password,
    role: role.trim(),
    fullName: fullName.trim(),
  };
}

/**
 * Registers a new user.
 * @param {Object} payload - registration data
 * @returns {Object} created user (password omitted)
 */
function registerUser(payload) {
  const validated = validateRegistration(payload);
  const newUser = {
    id: users.length + 1, // simple id generation
    email: validated.email,
    role: validated.role,
    fullName: validated.fullName,
    createdAt: new Date(),
  };
  users.push(newUser);
  // Return user without password
  return { ...newUser };
}

/* Example usage and simple tests */
try {
  console.log('--- Valid registration ---');
  const user = registerUser({
    email: 'alice@example.com',
    password: 'secure123',
    role: 'ADMIN',
    fullName: 'Alice Smith',
  });
  console.log('Registered user:', user);
} catch (err) {
  console.error('Unexpected error:', err.message);
}

try {
  console.log('\n--- Missing fullName ---');
  registerUser({
    email: 'bob@example.com',
    password: 'secret',
    role: 'USER',
    // fullName omitted
  });
} catch (err) {
  console.log('Expected error:', err.message);
}

try {
  console.log('\n--- Empty fullName ---');
  registerUser({
    email: 'carol@example.com',
    password: 'secret',
    role: 'USER',
    fullName: '   ',
  });
} catch (err) {
  console.log('Expected error:', err.message);
}

try {
  console.log('\n--- Invalid email ---');
  registerUser({
    email: '',
    password: 'secret',
    role: 'USER',
    fullName: 'Dave',
  });
} catch (err) {
  console.log('Expected error:', err.message);
}

/* Final state of mock DB */
console.log('\n--- Mock DB state ---');
console.log(users);