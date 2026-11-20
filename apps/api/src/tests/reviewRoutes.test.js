import express from "express";
import request from "supertest";
import { reviewRoutes } from "../routes/reviewRoutes.js";

jest.mock("../controllers/reviewController.js", () => ({
  getReviews: (req, res) => res.status(200).json([{ id: "rev-1", rating: 5, comment: "Great service!" }]),
  postReview: (req, res) => res.status(201).json({ id: "rev-2", rating: 4, comment: "Good work", userId: req.user?.id }),
}));

describe("Review Routes Authentication & Functionality", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/reviews", reviewRoutes);
  });

  describe("GET /api/reviews", () => {
    it("should allow unauthenticated access to fetch reviews", async () => {
      const response = await request(app).get("/api/reviews");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toEqual({
        id: "rev-1",
        rating: 5,
        comment: "Great service!"
      });
    });
  });

  describe("POST /api/reviews", () => {
    it("should reject requests without authorization header", async () => {
      const response = await request(app)
        .post("/api/reviews")
        .send({ rating: 5, comment: "Awesome!" });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "Unauthorized: Missing or invalid token"
      });
    });

    it("should reject requests with malformed authorization header", async () => {
      const response = await request(app)
        .post("/api/reviews")
        .set("Authorization", "Basic dXNlcjpwYXNz")
        .send({ rating: 5, comment: "Awesome!" });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "Unauthorized: Missing or invalid token"
      });
    });

    it("should reject requests with an invalid token", async () => {
      const response = await request(app)
        .post("/api/reviews")
        .set("Authorization", "Bearer invalid")
        .send({ rating: 5, comment: "Awesome!" });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "Unauthorized: Invalid or expired token"
      });
    });

    it("should allow authenticated requests and pass user context to postReview", async () => {
      const response = await request(app)
        .post("/api/reviews")
        .set("Authorization", "Bearer valid-auth-token")
        .send({ rating: 4, comment: "Good work" });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: "rev-2",
        rating: 4,
        comment: "Good work",
        userId: "user-123"
      });
    });

    it("should reject requests with empty Bearer token string", async () => {
      const response = await request(app)
        .post("/api/reviews")
        .set("Authorization", "Bearer ")
        .send({ rating: 5, comment: "Awesome!" });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "Unauthorized: Invalid or expired token"
      });
    });
  });
});
