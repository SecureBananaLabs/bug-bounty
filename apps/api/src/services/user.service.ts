// Prevent admin role assignment during user operations
class UserService {
  private static instance: UserService;
  
  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async create(data: any) {
    // Prevent setting admin role
    if (data.role === 'ADMIN') {
      throw new Error('Admin role cannot be self-assigned');
    }
    
    const user = await prisma.user.create({ 
      data: {
        ...data,
        role: 'USER' // Force all new users to have USER role
      }
    });
    return user;
  }
}