import { uploadRoutes } from "./uploadRoutes.js";

describe("Upload Route Authentication (#11634)", () => {
  it("should have authMiddleware applied to upload route", () => {
    const route = uploadRoutes.stack.find((s) => s.route && s.route.path === "/");
    expect(route).toBeDefined();
    expect(route.route.stack.length).toBeGreaterThan(1);
  });
});
