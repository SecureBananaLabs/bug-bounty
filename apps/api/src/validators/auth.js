--- a/apps/api/src/validators/auth.js
+++ b/apps/api/src/validators/auth.js
@@ -1,5 +1,7 @@
+const ALLOWED_REGISTRATION_ROLES = ['client', 'freelancer'];
+
 const validateRegistration = (req, res, next) => {
   const { email, password, name, role } = req.body;
 
   if (!email || !password || !name) {
     return res.status(400).json({ error: 'email, password, and name are required' });
   }
 
+  if (role && !ALLOWED_REGISTRATION_ROLES.includes(role)) {
+    return res.status(400).json({
+      error: `Invalid role. Allowed roles: ${ALLOWED_REGISTRATION_ROLES.join(', ')}`,
+    });
+  }
+
   next();
 };
 
 const validateLogin = (req, res, next) => {
   const { email, password } = req.body;
 
   if (!email || !password) {
     return res.status(400).json({ error: 'email and password are required' });
   }
 
   next();
 };
 
 module.exports = { validateRegistration, validateLogin };
