--- a/apps/api/src/config/env.js
+++ b/apps/api/src/config/env.js
@@ -1 +1,17 @@
-const PORT = Number(process.env.PORT ?? 4000);
+const DEFAULT_PORT = 4000;
+
+function parsePort(raw) {
+  if (raw === undefined || raw === null || raw === '') {
+    return DEFAULT_PORT;
+  }
+
+  const parsed = Number(raw);
+
+  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
+    console.warn(`[env] Invalid PORT "${raw}", falling back to ${DEFAULT_PORT}`);
+    return DEFAULT_PORT;
+  }
+
+  return parsed;
+}
+
+const PORT = parsePort(process.env.PORT);
