export async function connectDb() {
  // TODO: wire Prisma client from @freelanceflow/db package
  return { connected: true, driver: "prisma-placeholder" };
}

export async function disconnectDb() {
  // TODO: wire Prisma client $disconnect from @freelanceflow/db package
  return { connected: false, driver: "prisma-placeholder" };
}
