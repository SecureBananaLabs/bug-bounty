import { hash } from 'bcrypt';
import { UserRole } from '@prisma/client';
import { prisma } from '@packages/db';

export class AuthService {
  static async register(userData: {
    email: string;
    password: string;
    role?: UserRole;
  }) {
    const { email, password, role = UserRole.USER } = userData;
    
    // Validate role - prevent admin role assignment
    if (role === UserRole.ADMIN) {
      throw new Error('Admin role cannot be self-assigned during registration');
    }
    
    // Hash password
    const hashedPassword = await hash(password, 12);
    
    // Create user with validated role
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || UserRole.USER
      }
    });
    
    return {
      id: user.id,
      email: user.email,
      role: user.role
    };
  }
}