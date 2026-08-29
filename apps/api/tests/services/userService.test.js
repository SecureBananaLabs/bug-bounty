const { createUser, getUserById, getAllUsers } = require('../../src/services/userService');

describe('userService', () => {
  beforeEach(() => {
    // Clear the in-memory users array by re-requiring the module
    delete require.cache[require.resolve('../../src/services/userService')];
  });

  describe('createUser', () => {
    it('should create a user with valid data', () => {
      const user = createUser({ email: 'alice@example.com', fullName: 'Alice' });
      expect(user).toHaveProperty('id');
      expect(user.email).toBe('alice@example.com');
      expect(user.fullName).toBe('Alice');
    });

    it('should reject duplicate email with 409 error', () => {
      createUser({ email: 'bob@example.com', fullName: 'Bob' });
      expect(() => {
        createUser({ email: 'bob@example.com', fullName: 'Bob2' });
      }).toThrow('A user with this email already exists');
    });

    it('should reject missing email with 400 error', () => {
      expect(() => {
        createUser({ fullName: 'NoEmail' });
      }).toThrow('Email and fullName are required');
    });

    it('should reject missing fullName with 400 error', () => {
      expect(() => {
        createUser({ email: 'no@name.com' });
      }).toThrow('Email and fullName are required');
    });
  });

  describe('getUserById', () => {
    it('should return null for non-existent id', () => {
      expect(getUserById(999)).toBeNull();
    });

    it('should return user by id', () => {
      const user = createUser({ email: 'carol@example.com', fullName: 'Carol' });
      const found = getUserById(user.id);
      expect(found).toEqual(user);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', () => {
      createUser({ email: 'dave@example.com', fullName: 'Dave' });
      createUser({ email: 'eve@example.com', fullName: 'Eve' });
      const all = getAllUsers();
      expect(all.length).toBe(2);
    });
  });
});
