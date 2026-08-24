import { listUsers } from "./userService.js";

export async function getAdminMetrics() {
  return {
    openJobs: 42,
    activeFreelancers: 185,
    flaggedAccounts: 3,
    monthlyVolume: 128900
  };
}

export async function updateUserRole(userId, newRole) {
  const users = await listUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    throw new Error("User not found");
  }
  user.role = newRole;
  return { id: user.id, email: user.email, role: user.role };
}
