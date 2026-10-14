import { messageRoutes } from "./messageRoutes.js";

describe("Message Endpoint Authentication (#11587)", () => {
  it("should have authMiddleware applied to POST /api/messages route", () => {
    const postRoute = messageRoutes.stack.find((s) => s.route && s.route.path === "/" && s.route.methods.post);
    expect(postRoute).toBeDefined();
    expect(postRoute.route.stack.length).toBeGreaterThan(1);
  });
});
