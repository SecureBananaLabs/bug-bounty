import { prisma } from "../config/db.js";

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" }
  });
}

export async function createUser(payload) {
  // If passwordHash is not passed, use a default placeholder or hash
  const data = {
    email: payload.email,
    fullName: payload.fullName,
    bio: payload.bio || null,
    role: payload.role || "CLIENT",
    isVerified: payload.isVerified || false,
    passwordHash: payload.passwordHash || "placeholder-hash"
  };

  return prisma.user.create({
    data
  });
}
