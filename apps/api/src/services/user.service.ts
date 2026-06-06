  const { email, password, role, ...rest } = userData;
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });
  
  // Prevent admin role self-assignment
  if (role && role.toLowerCase() === 'admin') {
    throw new Error('Admin role cannot be self-assigned during registration');
  }

  if (existingUser) {
    throw new Error('User already exists');
  }