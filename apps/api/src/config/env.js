<content>
const requiredSecrets = {
  JWT_SECRET: process.env.JWT_SECRET,
};

// Validate that all required secrets are present and not default/insecure values
Object.entries(requiredSecrets).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Required environment variable ${key} is missing.`);
  }

  // Check for common insecure defaults
  const insecureDefaults = [
    'development-secret',
    'test-secret',
    'production-secret',
    'your-secret-key',
    'change-me',
    'default-secret',
  ];

  if (insecureDefaults.includes(value)) {
    throw new Error(
      `Required environment variable ${key} is set to an insecure default value. Please set a strong, unique secret.`
    );
  }
});

module.exports = {
  jwtSecret: requiredSecrets.JWT_SECRET,
};
</content>