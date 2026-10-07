const users = [];

function shouldRedactField(key) {
  const normalizedKey = key.toLowerCase();
  return normalizedKey === "password" || normalizedKey === "passwordhash" || normalizedKey.includes("token");
}

function redactCredentialFields(value) {
  if (Array.isArray(value)) {
    return value.map(redactCredentialFields);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !shouldRedactField(key))
      .map(([key, nestedValue]) => [key, redactCredentialFields(nestedValue)])
  );
}

export async function listUsers() {
  return users.map(redactCredentialFields);
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return redactCredentialFields(user);
}
