  async register(data: RegisterInput) {
    const { email, password, name, role } = data;

    // Prevent admin role self-assignment during registration
    if (role === 'ADMIN' || role === 'admin') {
      throw new AppError('Admin role cannot be self-assigned', 403);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });