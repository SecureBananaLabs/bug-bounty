  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name, role } = req.body;
      
      // Prevent self-assignment of admin role during registration
      if (role === 'ADMIN') {
        return res.status(403).json({ message: 'Cannot self-assign admin role during registration' });
      }
      
      const result = await authService.register({ email, password, name, role });
      res.status(201).json(result);
    } catch (error) {