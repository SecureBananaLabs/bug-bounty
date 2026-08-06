import { registerSchema } from '../validators/auth.js';

// Test 1: Valid client role
const r1 = registerSchema.safeParse({ email: "test@test.com", password: "password123", role: "client" });
if (!r1.success) throw new Error("Test 1 failed: client role should be valid");
console.log("PASS: client role accepted");

// Test 2: Valid freelancer role
const r2 = registerSchema.safeParse({ email: "test@test.com", password: "password123", role: "freelancer" });
if (!r2.success) throw new Error("Test 2 failed: freelancer role should be valid");
console.log("PASS: freelancer role accepted");

// Test 3: Default role is client
const r3 = registerSchema.safeParse({ email: "test@test.com", password: "password123" });
if (!r3.success) throw new Error("Test 3 failed: default should work");
if (r3.data.role !== "client") throw new Error("Test 3 failed: default role should be client");
console.log("PASS: default role is client");

// Test 4: Admin role is rejected
const r4 = registerSchema.safeParse({ email: "test@test.com", password: "password123", role: "admin" });
if (r4.success) throw new Error("Test 4 failed: admin role should be rejected");
console.log("PASS: admin role rejected");

// Test 5: Invalid role is rejected
const r5 = registerSchema.safeParse({ email: "test@test.com", password: "password123", role: "superadmin" });
if (r5.success) throw new Error("Test 5 failed: invalid role should be rejected");
console.log("PASS: invalid role rejected");

// Test 6: Missing email is rejected
const r6 = registerSchema.safeParse({ password: "password123" });
if (r6.success) throw new Error("Test 6 failed: missing email should be rejected");
console.log("PASS: missing email rejected");

console.log("\nAll 6 tests passed!");
