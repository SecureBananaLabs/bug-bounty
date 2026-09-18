import { registerUser } from "../services/userService.js";
import { db } from "@bug-bounty/db";

jest.mock("@bug-bounty/db", () => ({
  db: {
    user: {
      create: jest.fn(),
    },
  },
}));

describe("registerUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reject missing fullName", async () => {
    await expect(
      registerUser({
        email: "test@example.com",
        password: "password123",
        role: "CLIENT",
      })
    ).rejects.toThrow();
  });

  it("should preserve valid fullName in returned payload", async () => {
    const mockUser = {
      id: "1",
      email: "test@example.com",
      fullName: "John Doe",
      role: "CLIENT",
    };
    db.user.create.mockResolvedValue(mockUser);

    const result = await registerUser({
      email: "test@example.com",
      password: "password123",
      role: "CLIENT",
      fullName: "John Doe",
    });

    expect(result.fullName).toBe("John Doe");
    expect(db.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fullName: "John Doe" }),
      })
    );
  });
});