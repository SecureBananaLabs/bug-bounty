import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getUsers = asyncHandler(async (req, res) => {
  return ok(res, await listUsers());
});

export const postUser = asyncHandler(async (req, res) => {
  return ok(res, await createUser(req.body), 201);
});
