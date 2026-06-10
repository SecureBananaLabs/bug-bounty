import { db } from "@bug-bounty/db";
import { validateRegisterUser } from "../validation/userValidation.js";

export async function registerUser(data) {
  const validated = validateRegisterUser(data);
  const user = await db.user.create({
    data: {
      email: validated.email,
      password: validated.password,
      role: validated.role,
      fullName: validated.fullName,
    },
  });
  return user;
}

export async function listUsers() {
  return db.user.findMany();
}
  return user;
}
