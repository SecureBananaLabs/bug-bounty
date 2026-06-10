// Note: This is inferred file path based on the structure

import { hash } from "bcryptjs";
import { User } from "../models/user.js";
import { createUser as createPrismaUser } from "./prismaService.js";
  return users;
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return user;
}
