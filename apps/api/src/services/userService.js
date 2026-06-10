import { registerSchema } from "../schemas/auth.js";
import { hashPassword } from "../utils/auth.js";
import prisma from "../lib/prisma.js";

}

export async function createUser(payload) {
}

export async function registerUser(data) {
  const { email, password, role, fullName } = registerSchema.parse(data);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    data: {
      email,
      passwordHash: await hashPassword(password),
      fullName,
      role,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
    },
