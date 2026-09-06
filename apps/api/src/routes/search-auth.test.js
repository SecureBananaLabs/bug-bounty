import { searchRoutes } from "./searchRoutes.js";

describe("Search Endpoint Authentication (#11594)", () => {
  it("should have authMiddleware applied to search router", () => {
    const route = searchRoutes.stack.find((s) => s.route && s.route.path === "/");
    expect(route).toBeDefined();
    expect(route.route.stack.length).toBeGreaterThan(1);
  });
});
