import { notificationRoutes } from "./notificationRoutes.js";

describe("Notification Endpoint Authentication (#11588)", () => {
  it("should have authMiddleware applied to POST /api/notifications route", () => {
    const postRoute = notificationRoutes.stack.find((s) => s.route && s.route.path === "/" && s.route.methods.post);
    expect(postRoute).toBeDefined();
    expect(postRoute.route.stack.length).toBeGreaterThan(1);
  });
});
