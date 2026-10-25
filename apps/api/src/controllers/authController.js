import {
  AuthenticationError,
  loginUser,
  refreshToken,
  registerUser
} from "../services/authService.js";

function sendAuthError(res, error) {
  if (error instanceof AuthenticationError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  return res.status(500).json({ error: "Internal server error" });
}

export async function register(req, res) {
  try {
    const result = await registerUser(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return sendAuthError(res, error);
  }
}

export async function login(req, res) {
  try {
    const result = await loginUser(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return sendAuthError(res, error);
  }
}

export async function refresh(req, res) {
  try {
    return res.status(200).json(await refreshToken(req.body));
  } catch (error) {
    return sendAuthError(res, error);
  }
}
