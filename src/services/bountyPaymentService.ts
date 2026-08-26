--- a/src/services/bountyPaymentService.ts
+++ b/src/services/bountyPaymentService.ts
@@ -45,7 +45,7 @@
-    const payoutAmount = bounty.rewardAmount * 0.9; // dedução incorreta
+    const payoutAmount = bounty.rewardAmount;
@@ -62,3 +62,3 @@
-    if (bounty.status !== 'resolved') {
+    if (bounty.status !== 'resolved' && bounty.status !== 'approved') {
       throw new Error('Bounty not resolved');
