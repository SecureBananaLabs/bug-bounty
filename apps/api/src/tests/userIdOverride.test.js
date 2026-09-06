import { describe, it, expect } from "vitest";
import { createUser } from "../services/userService.js";

describe("createUser - server-owned id", () => {
  it("should ignore caller-supplied id and use server-generated one", async () => {
    const result = await createUser({
      id: "usr_malicious_override",
      email: "test@example.com",
      name: "Test"
    });

    expect(result.id).toMatch(/^usr_\d+$/);
    expect(result.id).not.toBe("usr_malicious_override");
    expect(result.email).toBe("test@example.com");
    expect(result.name).toBe("Test");
  });
});
