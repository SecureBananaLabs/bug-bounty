const users = [];

const ALLOWED_ROLES = ["client", "freelancer"];
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;

/**
 * Sanitize incoming user payload to prevent privilege escalation.
 */
function sanitizeUserPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid user payload: must be an object");
  }

  const { role, id, createdAt, updatedAt, ...rest } = payload;

  // Prevent admin role self-assignment (#2832)
  const safeRole = (role && ALLOWED_ROLES.includes(role)) ? role : "freelancer";

  // Truncate long fields
  const name = typeof rest.name === "string"
    ? rest.name.slice(0, MAX_NAME_LENGTH)
    : rest.name;
  const email = typeof rest.email === "string"
    ? rest.email.slice(0, MAX_EMAIL_LENGTH)
    : rest.email;

  return { ...rest, name, email, role: safeRole };
}

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const sanitized = sanitizeUserPayload(payload);
  const user = { id: `usr_${Date.now()}`, ...sanitized };
  users.push(user);
  return user;
}
