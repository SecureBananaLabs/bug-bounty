export function validateCreateUser(payload) {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Invalid user payload" };
  }
  const { email, fullName, role = "client", bio, skills = [] } = payload;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return { ok: false, error: "Valid email is required" };
  }
  if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
    return { ok: false, error: "Full name must be at least 2 characters" };
  }
  if (role === "admin" || !["client", "freelancer"].includes(role)) {
    return { ok: false, error: "Admin role cannot be self-assigned" };
  }
  return {
    ok: true,
    data: {
      email: email.trim().toLowerCase(),
      fullName: fullName.trim(),
      role,
      bio: typeof bio === "string" ? bio.trim() : undefined,
      skills: Array.isArray(skills) ? skills : []
    }
  };
}
