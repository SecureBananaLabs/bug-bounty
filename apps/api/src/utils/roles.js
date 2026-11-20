export const PUBLIC_ROLES = ["client", "freelancer"];
export const ADMIN_ROLE = "admin";

export function isValidPublicRole(role) {
  if (!role || typeof role !== "string") {
    return false;
  }
  const normalized = role.toLowerCase().trim();
  return PUBLIC_ROLES.includes(normalized);
}

export function isForbiddenPublicRole(role) {
  if (!role || typeof role !== "string") {
    return false;
  }
  return role.toLowerCase().trim() === ADMIN_ROLE;
}
