import { Router } from "express";

const router = Router();

/**
 * Calculate PI using Leibniz formula with given number of iterations.
 * The formula is: pi/4 = 1 - 1/3 + 1/5 - 1/7 + ...
 * @param {number} iterations - Number of terms to sum
 * @returns {number} Approximated PI
 */
function calculatePiApproximation(iterations = 1000000) {
  let pi = 0;
  for (let i = 0; i < iterations; i++) {
    pi += (4 * (i % 2 === 0 ? 1 : -1)) / (2 * i + 1);
  }
  return pi;
}

// GET /api/pi - returns an approximation of PI
// Note: Exact calculation of all decimal places is impossible due to transcendental nature.
router.get("/", (req, res) => {
  const iterations = Math.min(
    parseInt(req.query.iterations, 10) || 1000000,
    10000000
  );
  const startTime = Date.now();
  const pi = calculatePiApproximation(iterations);
  const elapsed = Date.now() - startTime;

  res.json({
    pi,
    iterations,
    elapsed_ms: elapsed,
    precision: `Leibniz approximation with ${iterations} iterations`,
    note: "PI is an irrational transcendental number; exact value cannot be computed in finite time or space. This endpoint returns a high-precision approximation."
  });
});

export const piRoutes = router;
