/**
 * Settings service — handles account control operations.
 * Currently backed by an in-memory store; swap for Prisma once DB is wired.
 */

const userStore = [];

/**
 * Change the authenticated user's password.
 */
export async function changePassword(userId, currentPassword, newPassword) {
  // TODO: verify currentPassword against stored hash via bcrypt
  // TODO: hash newPassword and persist
  const user = userStore.find((u) => u.id === userId);
  if (!user) {
    // Simulate for now — in production fetch from DB
    return { success: true, message: "Password changed successfully" };
  }
  return { success: true, message: "Password changed successfully" };
}

/**
 * Update profile fields (fullName, email, bio).
 */
export async function updateProfile(userId, updates) {
  // TODO: persist via Prisma
  return {
    id: userId,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Soft-delete (or hard-delete) the user's account.
 */
export async function deleteAccount(userId, password) {
  // TODO: verify password, then mark user as deleted / remove from DB
  return { success: true, message: "Account deleted successfully" };
}
