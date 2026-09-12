--- a/apps/api/src/services/authService.js
+++ b/apps/api/src/services/authService.js
@@ -1,3 +1,5 @@
+const ALLOWED_REGISTRATION_ROLES = ['client', 'freelancer'];
+
 const registerUser = async ({ email, password, name, role }) => {
+  // Defense-in-depth: never allow admin or any non-public role at registration
+  const safeRole = ALLOWED_REGISTRATION_ROLES.includes(role) ? role : 'client';
+
   // ... existing user creation logic ...
-  const user = await User.create({ email, password: hashedPassword, name, role: role || 'client' });
+  const user = await User.create({ email, password: hashedPassword, name, role: safeRole });
   return user;
 };
