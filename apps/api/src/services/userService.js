import { getDb } from "../config/prisma.js";
import { mapUser, nextId } from "./persistenceHelpers.js";

export async function listUsers() {
  const db = getDb();
  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" }
  });

  return users.map(mapUser);
}

export async function createUser(payload) {
  const db = getDb();
  const id = nextId("usr", payload.id);
  const email = payload.email ?? `${id}@placeholder.local`;
  const fullName = payload.fullName ?? payload.name ?? email.split("@")[0];

  const user = await db.user.create({
    data: {
      id,
      email,
      passwordHash: payload.passwordHash ?? "placeholder-hash",
      fullName,
      bio: payload.bio ?? null,
      role: String(payload.role ?? "client").toUpperCase(),
      isVerified: Boolean(payload.isVerified)
    }
  });

  return mapUser(user);
}
