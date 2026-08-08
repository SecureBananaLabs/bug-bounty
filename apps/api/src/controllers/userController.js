import { z } from "zod";
import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

const schema = z.object({}).passthrough();

export async function postUser(req, res) {
  const payload = schema.parse(req.body);
  return ok(res, await createUser(payload), 201);
}
