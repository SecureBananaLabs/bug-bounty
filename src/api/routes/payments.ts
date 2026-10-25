--- a/src/api/routes/payments.ts
+++ b/src/api/routes/payments.ts
@@ -120,7 +120,7 @@
-    const bounty = await BountyModel.findById(req.params.bountyId);
+    const bounty = await BountyModel.findById(req.params.bountyId).populate('researcher payout');
@@ -135,2 +135,5 @@
+    if (!bounty) {
+      return res.status(404).json({ error: 'Bounty not found' });
+    }
