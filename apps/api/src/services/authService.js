import bcrypt from "bcryptjs";
import { prisma } from "@bug-bounty/db";

export async function registerUser({ email, password, role, fullName }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error("Email already in use");
    role: payload.role,
    token: signAccessToken({ sub: `usr_${Date.now()}`, role: payload.role })
  };
}

  const user = await prisma.user.create({
    data: {
      email,
      fullName,
      passwordHash: await bcrypt.hash(password, 10),
      role: role ?? "CLIENT",
    },
  });

  return { id: user.id, email: user.email, fullName: user.fullName, role: user.role };
}
}
