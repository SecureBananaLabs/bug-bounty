  async register(data: RegisterInput) {
    const { email, password, name, role } = data;
    
    // Prevent self-assignment of admin role during registration
    if (role === 'ADMIN' || role === 'admin') {
      throw new Error('Admin role cannot be self-assigned');
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({