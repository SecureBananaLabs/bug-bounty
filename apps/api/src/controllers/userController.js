import { ok } from "../utils/response.js";
import { createUser, getUserById, listUsers } from "../services/userService.js";

export async function getUsers(req, res, next) {
  try {
    return ok(res, await listUsers());
  } catch (err) {
    next(err);
  }
}

export async function getUser(req, res, next) {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    return ok(res, user);
  } catch (err) {
    next(err);
  }
}

export async function postUser(req, res, next) {
  try {
    return ok(res, await createUser(req.body), 201);
  } catch (err) {
    next(err);
  }
}
