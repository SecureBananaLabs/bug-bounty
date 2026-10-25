export async function connectDb() {
  // TODO: wire Prisma client from @freelanceflow/db package
  return { connected: true, driver: "prisma-placeholder" };
}

/**
 * Readiness check: reports whether the API's dependencies are reachable.
 *
 * Returns a result object rather than throwing so the readiness route can
 * answer with a 503 instead of an unhandled rejection. Once the Prisma
 * client from @freelanceflow/db is wired in, `prisma.$queryRaw\`SELECT 1\``
 * becomes the real connectivity probe.
 */
export async function checkDb() {
  // TODO: replace with an actual round-trip once Prisma is connected
  return { ok: true, driver: "prisma-placeholder" };
}
