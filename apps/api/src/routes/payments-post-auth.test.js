import { paymentRoutes } from "./paymentRoutes.js";

describe("Payment Endpoint Authentication (#11576)", () => {
  it("should have authMiddleware applied to POST /api/payments route", () => {
    const postRoute = paymentRoutes.stack.find((s) => s.route && s.route.path === "/" && s.route.methods.post);
    expect(postRoute).toBeDefined();
    expect(postRoute.route.stack.length).toBeGreaterThan(1);
  });
});
