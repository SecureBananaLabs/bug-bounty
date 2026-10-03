const { createUserSchema } = require('../validators/user');

describe('POST /api/users payload validation', () => {
  const validPayload = {
    email: 'jane.doe@example.com',
    fullName: 'Jane Doe',
  };

  it('accepts a valid payload and defaults role to client', () => {
    const result = createUserSchema.safeParse(validPayload);

    expect(result.success).toBe(true);
    expect(result.data.email).toBe('jane.doe@example.com');
    expect(result.data.fullName).toBe('Jane Doe');
    expect(result.data.role).toBe('client');
  });

  it('rejects attempts to self-assign the admin role', () => {
    const result = createUserSchema.safeParse({ ...validPayload, role: 'admin' });

    expect(result.success).toBe(false);
    expect(
      result.error.issues.some((issue) => issue.path.includes('role'))
    ).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = createUserSchema.safeParse({ ...validPayload, email: 'not-an-email' });

    expect(result.success).toBe(false);
    expect(
      result.error.issues.some((issue) => issue.path.includes('email'))
    ).toBe(true);
  });

  it('rejects an empty or whitespace-only full name', () => {
    const result = createUserSchema.safeParse({ ...validPayload, fullName: '   ' });

    expect(result.success).toBe(false);
    expect(
      result.error.issues.some((issue) => issue.path.includes('fullName'))
    ).toBe(true);
  });

  it('allows client and freelancer roles explicitly', () => {
    for (const role of ['client', 'freelancer']) {
      const result = createUserSchema.safeParse({ ...validPayload, role });

      expect(result.success).toBe(true);
      expect(result.data.role).toBe(role);
    }
  });
});
