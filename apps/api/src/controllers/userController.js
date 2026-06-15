import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const { name, email, role } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email required" });
  }
  return ok(res, await createUser(req.body), 201);
}
