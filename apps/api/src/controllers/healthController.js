import { checkDb as defaultCheckDb } from "../config/db.js";

/**
 * Readiness probe for container orchestration (Docker/Kubernetes).
 *
 * Unlike /health, which only reports that the process is alive, this verifies
 * that the API's dependencies are available before the orchestrator routes
 * traffic to it. Returns 503 when a dependency is unreachable so the
 * orchestrator keeps the instance out of the load balancer.
 *
 * `checkDb` is injectable so the failure paths can be tested without a
 * database; it defaults to the real config probe.
 */
export async function readiness(req, res, { checkDb = defaultCheckDb } = {}) {
  try {
    const db = await checkDb();

    if (!db.ok) {
      return res.status(503).json({
        status: "not_ready",
        checks: { database: { ok: false, driver: db.driver ?? null } }
      });
    }

    return res.status(200).json({
      status: "ready",
      checks: { database: { ok: true, driver: db.driver ?? null } }
    });
  } catch (error) {
    // A probe must never crash the process it is inspecting.
    return res.status(503).json({
      status: "not_ready",
      checks: {
        database: { ok: false, error: error?.message ?? "readiness check failed" }
      }
    });
  }
}
