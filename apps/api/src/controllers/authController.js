import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { fail, ok } from "../utils/response.js";
import { ZodError } from "zod";

export async function register(req, res) {
  const payload = parseAuthPayload(registerSchema, req.body, res);
  if (!payload) {
    return;
  }

  const result = await registerUser(payload);
  return ok(res, result, 201);
}

export async function login(req, res) {
  const payload = parseAuthPayload(loginSchema, req.body, res);
  if (!payload) {
    return;
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

function parseAuthPayload(schema, body, res) {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      fail(res, "Invalid request body", 400);
      return null;
    }

    throw error;
  }
}
