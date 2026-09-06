import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  return ok(res, await createUser(req.body), 201);
}
  }
};

export const updatePayoutPreferences = async (req, res, next) => {
  try {
    const { method, details } = req.body;
    const user = await userService.updatePayoutPreferences(req.user.id, method, details);
    sendResponse(res, 200, 'Payout preferences updated successfully', user);
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
