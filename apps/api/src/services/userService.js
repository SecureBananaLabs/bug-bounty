diff --git a/apps/api/src/services/userService.js b/apps/api/src/services/userService.js
index 0000000..1111111 100644
--- a/apps/api/src/services/userService.js
+++ b/apps/api/src/services/userService.js
@@ -1,3 +1,14 @@
+const generateSecureId = () => {
+  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
+    return globalThis.crypto.randomUUID();
+  }
+
+  if (typeof require === 'function') {
+    return require('crypto').randomUUID();
+  }
+
+  throw new Error('Secure ID generation is not available in this runtime.');
+};
+
@@ -16,7 +27,7 @@
   const user = {
-    id: Date.now(),
+    id: generateSecureId(),
     username,
     email,
     password: hashedPassword,
