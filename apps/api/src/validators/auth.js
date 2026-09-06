export function validateRegister(payload) {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Invalid registration payload" };
  }
  const { email, password, role = "client" } = payload;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return { ok: false, error: "Valid email is required" };
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters" };
  }
  if (role === "admin" || !["client", "freelancer"].includes(role)) {
    return { ok: false, error: "Admin role cannot be self-assigned during registration" };
  }
  return {
    ok: true,
    data: {
      email: email.trim().toLowerCase(),
      password,
      role
    }
  };
}

export function validateLogin(payload) {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Invalid login payload" };
  }
  const { email, password } = payload;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return { ok: false, error: "Valid email is required" };
  }
  if (!password || typeof password !== "string" || password.trim().length === 0 || password.length < 8) {
    return { ok: false, error: "Invalid email or password" };
  }
  return {
    ok: true,
    data: {
      email: email.trim().toLowerCase(),
      password
    }
  };
}
