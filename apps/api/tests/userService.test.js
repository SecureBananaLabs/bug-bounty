const { createUser, getUserById, getAllUsers, deleteUser } = require('../src/services/userService');

beforeEach(() => {
  // Clear users array by deleting all users
  const allUsers = getAllUsers();
  allUsers.forEach(user => deleteUser(user.id));
});

describe('createUser', () => {
  it('should create a user with a server-generated id', () => {
    const user = createUser({ name: 'Alice', email: 'alice@example.com' });
    expect(user).toHaveProperty('id');
    expect(user.id).toMatch(/^usr_\d+$/);
  });

  it('should preserve normal payload fields', () => {
    const user = createUser({ name: 'Bob', email: 'bob@example.com' });
    expect(user.name).toBe('Bob');
    expect(user.email).toBe('bob@example.com');
  });

  it('should not allow caller-supplied id to override server-generated id', () => {
    const user = createUser({ id: 'usr_attacker', name: 'Eve' });
    expect(user.id).not.toBe('usr_attacker');
    expect(user.id).toMatch(/^usr_\d+$/);
  });

  it('should store the user in the in-memory store', () => {
    const user = createUser({ name: 'Charlie' });
    const found = getUserById(user.id);
    expect(found).toEqual(user);
  });
});

describe('getUserById', () => {
  it('should return null for non-existent id', () => {
    expect(getUserById('nonexistent')).toBeNull();
  });

  it('should return the correct user', () => {
    const user = createUser({ name: 'Dave' });
    expect(getUserById(user.id)).toEqual(user);
  });
});

describe('getAllUsers', () => {
  it('should return an empty array initially', () => {
    expect(getAllUsers()).toEqual([]);
  });

  it('should return all created users', () => {
    const user1 = createUser({ name: 'Alice' });
    const user2 = createUser({ name: 'Bob' });
    expect(getAllUsers()).toHaveLength(2);
    expect(getAllUsers()).toContainEqual(user1);
    expect(getAllUsers()).toContainEqual(user2);
  });
});

describe('deleteUser', () => {
  it('should return false for non-existent id', () => {
    expect(deleteUser('nonexistent')).toBe(false);
  });

  it('should delete an existing user', () => {
    const user = createUser({ name: 'Eve' });
    expect(deleteUser(user.id)).toBe(true);
    expect(getUserById(user.id)).toBeNull();
  });
});
