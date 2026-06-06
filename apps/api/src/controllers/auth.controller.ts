  const { email, password, role, ...rest } = req.body;
  // Prevent self-assignment of admin role
  if (role && role.toLowerCase() === 'admin') {
    return res.status(400).json({
      error: 'Admin role cannot be self-assigned'
    });
  }

  try {
    // Check if user already exists
    const existingUser = await findUserByEmail(email);