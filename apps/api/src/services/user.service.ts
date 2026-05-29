      throw new Error('User not found');
    }

    // Prevent self-assignment of admin role
    if (userId === currentUserId && role === 'ADMIN') {
      throw new ForbiddenError('Users cannot assign themselves the admin role');
    }

    return prisma.user.update({
      where: { id: userId },
      data: { role },