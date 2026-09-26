import { z } from "zod";
import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

const listUsersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20)
});

const createUserSchema = z.object({
  email: z.string().email().max(255),
  fullName: z.string().min(1).max(100),
  password: z.string().min(8).max(128),
  role: z.enum(["client", "freelancer"])
});

export async function getUsers(req, res) {
  const params = listUsersQuerySchema.parse(req.query);
  const allUsers = await listUsers();
  const start = (params.page - 1) * params.limit;
  const users = allUsers.slice(start, start + params.limit);
  return ok(res, {
    data: users,
    page: params.page,
    limit: params.limit,
    total: allUsers.length
  });
}

export async function postUser(req, res) {
  const payload = createUserSchema.parse(req.body);
  return ok(res, await createUser(payload), 201);
}
