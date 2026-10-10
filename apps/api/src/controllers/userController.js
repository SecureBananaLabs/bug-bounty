import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { parsePagination, paginate } from "../utils/pagination.js";

export async function getUsers(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { items, total } = await listUsers({ skip, limit });
  return ok(res, paginate(items, total, page, limit));
}

export async function postUser(req, res) {
  return ok(res, await createUser(req.body), 201);
}
