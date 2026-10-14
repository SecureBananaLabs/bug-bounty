import { ZodError } from "zod";
import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { fail, ok } from "../utils/response.js";

function invalidRequestBody(res, error) {
  if (error instanceof ZodError) {
    return fail(res, "Invalid request body", 400);
  }

  throw error;
}

export async function register(req, res) {
  const payload = registerSchema.parse(req.body);
  const result = await registerUser(payload);
  return ok(res, result, 201);
}

export async function login(req, res) {
  let payload;
  try {
    payload = loginSchema.parse(req.body);
  } catch (error) {
    return invalidRequestBody(res, error);
  }

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
  const result = await refreshToken();
  return ok(res, result);
}
