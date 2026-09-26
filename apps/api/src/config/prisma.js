import { PrismaClient } from "@freelanceflow/db";

let prismaClient;
let testClient;

export function getDb() {
  if (testClient) {
    return testClient;
  }

  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }

  return prismaClient;
}

export function setDbClientForTests(client) {
  testClient = client;
  prismaClient = client;
}

export function resetDbClientForTests() {
  testClient = undefined;
  prismaClient = undefined;
}

export async function disconnectDb() {
  if (!testClient && prismaClient && typeof prismaClient.$disconnect === "function") {
    await prismaClient.$disconnect();
  }

  prismaClient = undefined;
}
