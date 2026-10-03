<content>
import { prisma } from '../prisma';

export const registerUser = async ({ email, password, role, fullName }) => {
  const user = await prisma.user.create({
    data: {
      email,
      password,
      role,
      fullName,
    },
    select: {
      id: true,
      email: true,
      role: true,
      fullName: true,
      createdAt: true,
    },
  });

  return user;
};
</content>