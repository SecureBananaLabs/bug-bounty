import { db } from "@bug-bounty/db";

export async function registerUser(data) {
  const user = await db.user.create({
    data: {
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      role: data.role,
    },
  });
}
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    createdAt: user.createdAt,
  };
}
