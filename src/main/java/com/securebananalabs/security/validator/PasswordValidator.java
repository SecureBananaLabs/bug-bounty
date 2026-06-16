package com.securebananalabs.security.validator;

import java.util.regex.Pattern;

public class PasswordValidator {
    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 64;
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("\\d");
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]");

    public ValidationResult validate(String password) {
        ValidationResult result = new ValidationResult();

        if (password == null || password.isEmpty()) {
            result.setValid(false);
            result.addError("Password cannot be empty");
            return result;
        }

        if (password.length() < MIN_LENGTH) {
            result.setValid(false);
            result.addError("Password must be at least " + MIN_LENGTH + " characters long");
        }

        if (password.length() > MAX_LENGTH) {
            result.setValid(false);
            result.addError("Password must be no more than " + MAX_LENGTH + " characters long");
        }

        if (!UPPERCASE_PATTERN.matcher(password).find()) {
            result.setValid(false);
            result.addError("Password must contain at least one uppercase letter");
        }

        if (!LOWERCASE_PATTERN.matcher(password).find()) {
            result.setValid(false);
            result.addError("Password must contain at least one lowercase letter");
        }

        if (!DIGIT_PATTERN.matcher(password).find()) {
            result.setValid(false);
            result.addError("Password must contain at least one digit");
        }

        if (!SPECIAL_CHAR_PATTERN.matcher(password).find()) {
            result.setValid(false);
            result.addError("Password must contain at least one special character");
        }

        // Check for common weak passwords
        if (isCommonPassword(password)) {
            result.setValid(false);
            result.addError("Password is too common and easily guessable");
        }

        return result;
    }

    private boolean isCommonPassword(String password) {
        String[] commonPasswords = {
            "password", "123456", "qwerty", "admin", "welcome",
            "password123", "12345678", "123456789", "1234567890"
        };
        
        String lowerPassword = password.toLowerCase();
        for (String common : commonPasswords) {
            if (lowerPassword.equals(common) || lowerPassword.contains(common)) {
                return true;
            }
        }
        return false;
    }

    public static class ValidationResult {
        private boolean valid = true;
        private java.util.List<String> errors = new java.util.ArrayList<>();

        public boolean isValid() {
            return valid;
        }

        public void setValid(boolean valid) {
            this.valid = valid;
        }

        public java.util.List<String> getErrors() {
            return errors;
        }

        public void addError(String error) {
            errors.add(error);
        }
    }
}