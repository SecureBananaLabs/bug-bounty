import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../validators/auth.js";

test("register schema defaults public users to client role", () => {
    const payload = registerSchema.parse({
          email: "new-user@example.com",
          password: "password123"
    });

       assert.equal(payload.role, "client");
});

test("register schema accepts public registration roles", () => {
    const clientPayload = registerSchema.parse({
          email: "client@example.com",
          password: "password123",
          role: "client"
    });

       const freelancerPayload = registerSchema.parse({
             email: "freelancer@example.com",
             password: "password123",
             role: "freelancer"
       });

       assert.equal(clientPayload.role, "client");
    assert.equal(freelancerPayload.role, "freelancer");
});

test("register schema rejects admin self-assignment", () => {
    assert.throws(
          () =>
                  registerSchema.parse({
                            email: "admin@example.com",
                            password: "password123",
                            role: "admin"
                  }),
          /Invalid enum value/
        );
});
