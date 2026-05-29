  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name, role } = req.body;
      
      // Prevent self-assignment of admin role during registration
      if (role === 'ADMIN') {
        return res.status(403).json({ message: 'Admin role cannot be self-assigned during registration' });
      }
      
      const result = await authService.register({ email, password, name, role });
      res.status(201).json(result);
    } catch (error) {
    }
  }
);

  async register(data: RegisterInput) {
    const { email, password, name, role } = data;

    // Prevent self-assignment of admin role during registration
    if (role === 'ADMIN') {
      throw new Error('Admin role cannot be self-assigned');
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
        role: role || 'FREELANCER',
      },
    const token = generateToken(user);
    return { user: sanitizeUser(user), token };
  }
  
  async login(data: LoginInput) {
    const { email, password } = data;

    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');

    const token = generateToken(user);
    return { user: sanitizeUser(user), token };
  }
  
  async refreshToken(token: string) {
    // Implementation for token refresh
  }
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['FREELANCER', 'CLIENT']).optional(),
});

export const loginSchema = z.object({