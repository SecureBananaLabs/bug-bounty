import { PrismaClient } from "@prisma/client";
import { describe, it, expect } from "vitest";

describe("DB Package Import Test", () => {
  it("should import PrismaClient from the package entrypoint", async () => {
    const { PrismaClient: ImportedPrismaClient } = await import("@freelanceflow/db");
    expect(ImportedPrismaClient).toBe(PrismaClient);
  });
});