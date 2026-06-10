import bcrypt from "bcryptjs";
import { prisma } from "@bug-bounty/db";
import { generateTokens } from "../utils/jwt.js";
import AppError from "../utils/AppError.js";

export async function registerUser(data) {
  const existing = await prisma.user.findUnique({
    role: payload.role,
    token: signAccessToken({ sub: `usr_${Date.now()}`, role: payload.role })
  };
}


  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
    },
  });

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

    throw new AppError("Invalid credentials", 401);
  }

  const { password: _, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    tokens: generateTokens(user),
