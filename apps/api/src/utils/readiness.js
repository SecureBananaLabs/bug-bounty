import { connectDb } from "../config/db.js";

// A readiness probe has to prove a dependency answers, not just that the
// process exists. Any rejection or falsy result flips the probe to not-ready.
export async function checkReadiness(connect = connectDb) {
  try {
    const result = await connect();

    return Boolean(result?.connected);
  } catch {
    return false;
  }
}
