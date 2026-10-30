import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  passwordComplexitySchema,
  validatePasswordComplexity,
  registerSchema
} from "../validators/auth.js";

describe("Password Complexity Validator (passwordComplexitySchema)", () => {
  it("accepts strong passwords meeting all complexity requirements", () => {
    const res = validatePasswordComplexity("Secur3#Pass!");
    assert.equal(res.success, true);

    const reg = registerSchema.safeParse({
      email: "dev@example.com",
      password: "V@lidPassword99"
    });
    assert.equal(reg.success, true);
  });

  it("rejects passwords shorter than 8 characters", () => {
    const res = passwordComplexitySchema.safeParse("Ab1!xy");
    assert.equal(res.success, false);
    assert.match(res.error.issues[0].message, /at least 8 characters/i);
  });

  it("rejects passwords missing uppercase, lowercase, digit, or special character", () => {
    // Missing uppercase
    assert.equal(passwordComplexitySchema.safeParse("lowercase123!").success, false);
    // Missing lowercase
    assert.equal(passwordComplexitySchema.safeParse("UPPERCASE123!").success, false);
    // Missing number
    assert.equal(passwordComplexitySchema.safeParse("NoNumbersHere!").success, false);
    // Missing special character
    assert.equal(passwordComplexitySchema.safeParse("OnlyAlphaNum123").success, false);
  });
});
