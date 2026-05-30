import { fail, ok } from "../utils/response.js";
import { changePassword, updateProfile, deleteAccount } from "../services/settingsService.js";
import { changePasswordSchema, updateProfileSchema, deleteAccountSchema } from "../validators/settings.js";

export async function handleChangePassword(req, res) {
  const payload = changePasswordSchema.parse(req.body);
  const userId = req.user.sub;
  const result = await changePassword(userId, payload.currentPassword, payload.newPassword);
  return ok(res, result);
}

export async function handleUpdateProfile(req, res) {
  const payload = updateProfileSchema.parse(req.body);
  const userId = req.user.sub;
  const result = await updateProfile(userId, payload);
  return ok(res, result);
}

export async function handleDeleteAccount(req, res) {
  const payload = deleteAccountSchema.parse(req.body);
  const userId = req.user.sub;
  const result = await deleteAccount(userId, payload.password);
  return ok(res, result);
}
