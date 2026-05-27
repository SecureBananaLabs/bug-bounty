import { asyncHandler } from "../middleware/asyncHandler.js";
import { ok } from "../utils/response.js";
import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";

export const register = asyncHandler(async (req, res) => {
  const payload = registerSchema.parse(req.body);
  const result = await registerUser(payload);
  return ok(res, result, 201);
});

export const login = asyncHandler(async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const result = await loginUser(payload);
  return ok(res, result);
});

export async function oauthCallback(req, res) {
  return ok(res, {
    provider: req.params.provider,
    status: "callback-received"
  });
}

export async function refresh(req, res) {
  const result = await refreshToken();
  return ok(res, result);
}
