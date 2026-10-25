import { registerSchema, loginSchema } from "../validators/auth.js";
import { fail, ok } from "../utils/response.js";
import { loginUser, refreshToken, registerUser } from "../services/authService.js";

export async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    const [issue] = parsed.error.issues;
    const path =
      issue && Array.isArray(issue.path) && issue.path.length > 0
        ? issue.path.join(".")
        : "body";
    return fail(res, `${path} is invalid`, 400);
  }

  const payload = parsed.data;
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
  const result = await refreshToken();
  return ok(res, result);
}
