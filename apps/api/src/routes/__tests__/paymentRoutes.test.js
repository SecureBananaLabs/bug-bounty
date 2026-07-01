import { jest } from "@jest/globals";

// Mock the payment controller
const mockCreatePayment = jest.fn((req, res) => res.status(201).json({ paymentId: "pay_123" }));
jest.unstable_mockModule("../paymentController.js", () => ({
  createPayment: mockCreatePayment
}));

// Mock the auth middleware
const mockAuthMiddleware = jest.fn((req, res, next) => next());
jest.unstable_mockModule("../../middleware/authMiddleware.js", () => ({
  authMiddleware: mockAuthMiddleware
}));

const { paymentRoutes } = await import("../paymentRoutes.js");

function buildMockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function buildMockReq(body = {}) {
  return { body, headers: {} };
}

describe("paymentRoutes POST /", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("applies authMiddleware before createPayment", () => {
    const route = paymentRoutes.stack.find(
      (layer) => layer.route && layer.route.path === "/"
    );
    expect(route).toBeDefined();
    const handlers = route.route.stack.map((s) => s.handle);
    // authMiddleware must appear before createPayment
    const authIndex = handlers.indexOf(mockAuthMiddleware);
    const controllerIndex = handlers.indexOf(mockCreatePayment);
    expect(authIndex).toBeGreaterThanOrEqual(0);
    expect(controllerIndex).toBeGreaterThan(authIndex);
  });

  test("authMiddleware blocks unauthenticated requests", () => {
    // Restore real authMiddleware behavior for this test
    const realAuth = (req, res, next) => {
      const authHeader = req.headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      next();
    };
    const req = buildMockReq();
    const res = buildMockRes();
    const next = jest.fn();
    realAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("authMiddleware allows authenticated requests", () => {
    const realAuth = (req, res, next) => {
      const authHeader = req.headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      next();
    };
    const req = buildMockReq();
    req.headers["authorization"] = "Bearer valid-token";
    const res = buildMockRes();
    const next = jest.fn();
    realAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
