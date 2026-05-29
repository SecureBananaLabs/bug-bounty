  async register(data: RegisterInput) {
    const { email, password, name, role } = data;
    
    // Prevent self-assignment of admin role during registration
    if (role === 'ADMIN' || role === 'admin') {
      throw new ForbiddenError('Admin role cannot be self-assigned during registration');
    }
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictError('User already exists');