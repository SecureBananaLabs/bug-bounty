import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { ok, fail } from "../utils/response.js";
import { z } from "zod";

export async function register(req, res) {
  const payload = registerSchema.parse(req.body);
  const result = await registerUser(payload);
  return ok(res, result, 201);
}

export async function login(req, res) {
  const payload = loginSchema.parse(req.body);
  const result = await loginUser(payload);
  return ok(res, result);
}

export async function oauthCallback(req, res) {
  return ok(res, {
    provider: req.params.provider,
    status: "callback-received"
  });
}

export async function refresh(req, res) {
  const schema = z.object({ refreshToken: z.string().min(1) });

  try {
    const payload = schema.parse(req.body);
    const result = await refreshToken(payload.refreshToken);
    return ok(res, result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(res, "Missing refresh token", 401);
    }

    return fail(res, "Invalid refresh token", 401);
  }
}
