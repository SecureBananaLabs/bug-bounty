  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name, role } = req.body;
      
      // Prevent admin role self-assignment during registration
      if (role === 'ADMIN') {
        throw new AppError('Admin role cannot be self-assigned', 403);
      }
      
      const result = await authService.register({ email, password, name, role });
      res.status(201).json(result);
    } catch (error) {