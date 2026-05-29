    try {
      const { userId, role } = req.body;

      // Prevent self-assignment of admin role
      if (req.user?.id === userId && role === 'ADMIN') {
        res.status(403).json({ message: 'You cannot assign yourself the admin role' });
        return;
      }

      const updatedUser = await userService.updateUserRole(userId, role);
      res.json(updatedUser);
    } catch (error) {