import { badRequest, created } from "../utils/response.js";
import { PUBLIC_ROLES, isValidPublicRole } from "../utils/roles.js";

export async function register(req, res) {
  const { email, password, name, role = "client" } = req.body || {};

  if (!email || !password) {
    return badRequest(res, "Email and password are required.");
  }

  const normalizedRole = typeof role === "string" ? role.toLowerCase().trim() : role;

  if (!isValidPublicRole(normalizedRole)) {
    return badRequest(
      res,
      `Role '${role}' is not permitted for public registration. Allowed roles: ${PUBLIC_ROLES.join(", ")}`
    );
  }

  const user = {
    id: `user_${Date.now()}`,
    email,
    name: name || "",
    role: normalizedRole,
  };

  return created(res, {
    user,
    message: "User registered successfully",
  });
}
