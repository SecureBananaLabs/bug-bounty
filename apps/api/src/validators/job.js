--- a/apps/api/src/validators/job.js
+++ b/apps/api/src/validators/job.js
@@ -12,8 +12,19 @@ export const createJobSchema = z.object({
   // ... existing fields ...
   budgetMin: z.number().min(0),
   budgetMax: z.number().min(0),
-});
+})
+.refine(
+  (data) =>
+    data.budgetMin == null ||
+    data.budgetMax == null ||
+    data.budgetMax >= data.budgetMin,
+  {
+    message: "budgetMax must be greater than or equal to budgetMin",
+    path: ["budgetMax"],
+  }
+);
