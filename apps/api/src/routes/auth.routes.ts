    try {
      const { email, password, name, role } = req.body;
      
      // Prevent self-assignment of admin role during registration
      if (role === 'ADMIN' || role === 'admin') {
        return res.status(403).json({ 
          message: 'Admin role cannot be self-assigned during registration' 
        });
      }
      
      const user = await authService.register({ email, password, name, role });
      res.status(201).json(user);
    } catch (error) {