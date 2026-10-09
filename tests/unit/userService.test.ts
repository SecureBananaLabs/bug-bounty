import { createUser, getUserById } from '../../src/services/userService';

describe('userService', () => {
  describe('createUser', () => {
    it('should generate a server-side UUID and ignore caller-provided id', () => {
      const result = createUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'securePassword123',
        role: 'submitter',
      } as any);

      expect(result.id).toBeDefined();
      expect(result.id).not.toBe('caller-controlled-id');
      expect(result.username).toBe('testuser');
      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe('securePassword123');
      expect(result.roles).toEqual(['submitter']);
    });

    it('should ignore an explicit id property in payload', () => {
      const result = createUser({
        id: 'malicious-id',
        username: 'trickyuser',
        email: 'tricky@example.com',
        password: 'password',
        role: 'reviewer',
      } as any);

      expect(result.id).not.toBe('malicious-id');
      expect(result.username).toBe('trickyuser');
      expect(result.email).toBe('tricky@example.com');
      expect(result.roles).toEqual(['reviewer']);
    });

    it('should preserve all non-id payload fields', () => {
      const result = createUser({
        username: 'fulluser',
        email: 'full@example.com',
        password: 'mySecret',
        role: 'analyst',
      } as any);

      expect(result.username).toBe('fulluser');
      expect(result.email).toBe('full@example.com');
      expect(result.password).toBe('mySecret');
      expect(result.status).toBe('active');
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should generate unique IDs across multiple creations', () => {
      const user1 = createUser({
        username: 'user1',
        email: 'user1@example.com',
        password: 'pass1',
        role: 'submitter',
      } as any);

      const user2 = createUser({
        username: 'user2',
        email: 'user2@example.com',
        password: 'pass2',
        role: 'submitter',
      } as any);

      expect(user1.id).not.toBe(user2.id);
    });
  });

  describe('getUserById', () => {
    it('should return a user by their server-generated ID', () => {
      const created = createUser({
        username: 'lookupuser',
        email: 'lookup@example.com',
        password: 'pass',
        role: 'admin',
      } as any);

      const found = getUserById(created.id);
      expect(found).toBeDefined();
      expect(found!.username).toBe('lookupuser');
    });
  });
});
