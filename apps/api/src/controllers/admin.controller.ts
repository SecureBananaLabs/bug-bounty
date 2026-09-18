  updateUserRole: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, role } = req.body;
      const currentUserId = req.user?.id;

      // Prevent self-assignment of admin role
      if (currentUserId === userId && role === 'ADMIN') {
        throw new ForbiddenError('You cannot assign yourself the admin role');
      }

      const result = await userService.updateUserRole(userId, role, currentUserId);
      res.json(result);