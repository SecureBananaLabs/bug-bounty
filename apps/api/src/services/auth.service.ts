      throw new Error('User already exists');
    }

    // Prevent self-assignment of admin role during registration
    if (userData.role === 'ADMIN') {
      throw new Error('Cannot self-assign admin role during registration');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await prisma.user.create({