import { registerSchema, loginSchema } from "../validators/auth.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";
import { fail, ok } from "../utils/response.js";

function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    return { error: "Invalid request body" };
  }
  return { data: result.data };
}

export async function register(req, res) {
  const payload = parseBody(registerSchema, req.body);
  if (payload.error) {
    return fail(res, payload.error, 400);
  }

  const result = await registerUser(payload.data);
  return ok(res, result, 201);
}

export async function login(req, res) {
  const payload = parseBody(loginSchema, req.body);
  if (payload.error) {
    return fail(res, payload.error, 400);
  }

  const result = await loginUser(payload.data);
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
