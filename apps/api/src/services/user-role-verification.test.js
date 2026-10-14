import { createUser, updateUserRole } from "./userService.js";

describe("User Role Update Verification (#11597)", () => {
  it("should reject invalid user roles", async () => {
    const user = await createUser({ email: "test@example.com", role: "client" });
    await expect(updateUserRole(user.id, "supergod")).rejects.toThrow();
  });

  it("should update valid user role", async () => {
    const user = await createUser({ email: "test2@example.com", role: "client" });
    const updated = await updateUserRole(user.id, "admin");
    expect(updated.role).toBe("admin");
  });
});
