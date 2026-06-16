package com.securebananalabs.security.validator;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PasswordValidatorTest {

    @Test
    void testValidPassword() {
        PasswordValidator validator = new PasswordValidator();
        PasswordValidator.ValidationResult result = validator.validate("StrongPass123!");
        assertTrue(result.isValid());
        assertEquals(0, result.getErrors().size());
    }

    @Test
    void testTooShort() {
        PasswordValidator validator = new PasswordValidator();
        PasswordValidator.ValidationResult result = validator.validate("Short1!");
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Password must be at least 8 characters long"));
    }

    @Test
    void testTooLong() {
        PasswordValidator validator = new PasswordValidator();
        String longPassword = "A".repeat(65) + "a1!";
        PasswordValidator.ValidationResult result = validator.validate(longPassword);
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Password must be no more than 64 characters long"));
    }

    @Test
    void testNoUppercase() {
        PasswordValidator validator = new PasswordValidator();
        PasswordValidator.ValidationResult result = validator.validate("lowercase123!");
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Password must contain at least one uppercase letter"));
    }

    @Test
    void testNoLowercase() {
        PasswordValidator validator = new PasswordValidator();
        PasswordValidator.ValidationResult result = validator.validate("UPPERCASE123!");
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Password must contain at least one lowercase letter"));
    }

    @Test
    void testNoDigit() {
        PasswordValidator validator = new PasswordValidator();
        PasswordValidator.ValidationResult result = validator.validate("NoDigitsHere!");
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Password must contain at least one digit"));
    }

    @Test
    void testNoSpecialChar() {
        PasswordValidator validator = new PasswordValidator();
        PasswordValidator.ValidationResult result = validator.validate("NoSpecial123");
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Password must contain at least one special character"));
    }

    @Test
    void testCommonPasswordExactMatch() {
        PasswordValidator validator = new PasswordValidator();
        PasswordValidator.ValidationResult result = validator.validate("password");
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Password is too common and easily guessable"));
    }

    @Test
    void testCommonPasswordContains() {
        PasswordValidator validator = new PasswordValidator();
        PasswordValidator.ValidationResult result = validator.validate("mypassword123!");
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Password is too common and easily guessable"));
    }

    @Test
    void testNullPassword() {
        PasswordValidator validator = new PasswordValidator();
        PasswordValidator.ValidationResult result = validator.validate(null);
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Password cannot be empty"));
    }

    @Test
    void testEmptyPassword() {
        PasswordValidator validator = new PasswordValidator();
        PasswordValidator.ValidationResult result = validator.validate("");
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Password cannot be empty"));
    }

    @Test
    void testMultipleErrors() {
        PasswordValidator validator = new PasswordValidator();
        PasswordValidator.ValidationResult result = validator.validate("short");
        assertFalse(result.isValid());
        assertTrue(result.getErrors().size() > 1);
    }

    @Test
    void testEdgeCaseExactMaxLength() {
        PasswordValidator validator = new PasswordValidator();
        String password = "A".repeat(61) + "a1!";
        PasswordValidator.ValidationResult result = validator.validate(password);
        assertTrue(result.isValid());
        assertEquals(0, result.getErrors().size());
    }

    @Test
    void testEdgeCaseExactMinLength() {
        PasswordValidator validator = new PasswordValidator();
        PasswordValidator.ValidationResult result = validator.validate("Aa1!aaaa");
        assertTrue(result.isValid());
        assertEquals(0, result.getErrors().size());
    }
}